# Unified Prime Equation

A public repository presenting the Unified Prime Equation, showing how primes and Goldbach pairs emerge from a single framework with minimal correction.

- **Live demo (GitHub Pages):** open `index.html` from this repo on GitHub Pages.
- **Calculator:** unified Prime / Goldbach calculator (BigInt for moderate sizes, Log-mode preview for huge inputs).
- **Paper:** see [`paper.md`](./paper.md) for a concise statement and examples.
- **About:** see [`about.html`](./about.html).

## What is it?
One equation, two faces:
- **Prime Equation:** given a center \(X\), find a small offset \(u\) such that \(X+u\) is prime.
- **Goldbach motif:** for even \(E=2x\), find \(t\) such that \(x-t\) and \(x+t\) are both prime.

It relies on:
1) a finite sieve up to \(P ≍ \log N\),  
2) a central window \(T ≍ (\log N)^2\),  
3) a tiny bounded correction (Δ_step ∈ {0,1,2} in practice).

## How to use
- For moderate inputs (e.g., up to ~3.4e14), the demo performs exact primality checks in-browser.
- For astronomical inputs (e.g., `10^1000`), the demo returns predicted parameters \(P, T\) and expected Δ_step (no in-browser primality).

## Cite
Bahbouhi Bouchaib (2025). *Unified Prime Equation — Goldbach as a Motif*. GitHub repository.

## License
MIT © 2025 Bahbouhi Bouchaib.  
If you reuse this work (code or ideas), please **credit the author** (“Bahbouhi Bouchaib”) and link back to this repository.
