// Noise-gate AudioWorkletProcessor.
// Below `threshold` (linear 0..1, peak), the signal is silenced; above it,
// passes through 1:1. attack/release smooth the gate gain so we don't hear
// clicks and short pauses between words don't slam it shut.
class NoiseGateProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: 0,     minValue: 0,     maxValue: 1, automationRate: 'k-rate' },
            { name: 'attack',    defaultValue: 0.005, minValue: 0.001, maxValue: 0.1, automationRate: 'k-rate' },
            { name: 'release',   defaultValue: 0.2,   minValue: 0.05,  maxValue: 2,   automationRate: 'k-rate' },
        ];
    }

    constructor() {
        super();
        this.env = 0;
        this.gain = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || input.length === 0 || !output || output.length === 0) return true;

        const inCh = input[0];
        const outCh = output[0];
        if (!inCh) {
            // Upstream gave us no audio yet — keep the node alive but emit silence.
            for (let ch = 0; ch < output.length; ch++) output[ch].fill(0);
            return true;
        }

        const threshold = parameters.threshold[0];
        const attack = parameters.attack[0];
        const release = parameters.release[0];

        // Disabled gate — threshold at 0 means always open.
        if (threshold <= 0) {
            for (let ch = 0; ch < output.length; ch++) {
                const o = output[ch];
                const i = input[ch] || inCh;
                for (let n = 0; n < o.length; n++) o[n] = i[n];
            }
            this.gain = 1;
            this.env = 0;
            return true;
        }

        const envCoef = Math.exp(-1 / (sampleRate * release));
        const attackCoef = 1 - Math.exp(-1 / (sampleRate * attack));
        const releaseCoef = 1 - Math.exp(-1 / (sampleRate * release));

        for (let n = 0; n < inCh.length; n++) {
            const x = Math.abs(inCh[n]);
            if (x > this.env) this.env = x;
            else this.env = x + (this.env - x) * envCoef;

            const target = this.env > threshold ? 1 : 0;
            const coef = target > this.gain ? attackCoef : releaseCoef;
            this.gain += (target - this.gain) * coef;

            const g = this.gain;
            for (let ch = 0; ch < output.length; ch++) {
                const i = input[ch] || inCh;
                output[ch][n] = i[n] * g;
            }
        }

        return true;
    }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);