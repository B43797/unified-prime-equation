# Unified Prime Equation — Statement, Method, and Examples

**Author:** Bahbouhi Bouchaib  
**Date:** 2025

## 0) Abstract
We present a unified framework that simultaneously explains prime detection near any integer and Goldbach decompositions for even numbers. The method relies on (i) a finite sieve up to \(P ≍ \log N\), (ii) a central window \(T ≍ (\log N)^2\), and (iii) a bounded correction on admissible offsets (Δ_step ∈ {0,1,2} in practice). Goldbach is the symmetric motif of the same equation. We provide an operational theorem statement and a minimal algorithm whose sieving cost is \(O((\log N)^3)\), plus a handful of primality checks.

> Plain symbols are used; no LaTeX is required to read this note.

---

## 1) The Unified Prime Equation (plain statement)
Let \(N\) be large and \(c\) a center. Let \(H(\theta)\) be a finite linear motif of integer offsets.

- **Prime motif:** \(H(\theta)=\{\theta\}\) (seek \(c+\theta\) prime).  
- **Goldbach motif:** \(H(\theta)=\{-\theta,+\theta\}\) (seek both \(c-\theta\) and \(c+\theta\) prime).

Set \(P = c_1 \log N\) and \(T = c_2 (\log N)^2\) with positive constants \(c_1,c_2\).  
Define admissible offsets \(\theta\) as those for which, for every prime \(s \le P\) and every \(h \in H(\theta)\), we have \(c + h(\theta) \not\equiv 0 \pmod s\).

**Existence of admissibles.** In \(|\theta| \le T\), the number of admissible offsets is at least \((2T+1)\,\delta(P)\), with  
\(\delta(P) = \prod_{s \le P} (1 - \nu_s/s) > 0\), where \(\nu_s\) counts forbidden residue classes for the motif.

**Short-list and correction.** Rank admissible \(\theta\) by a hybrid score \(\Sigma = A + \lambda W\), where \(A\) is the fraction of \(s \le P\) not excluding \(\theta\), and \(W(\theta;T)=1-(\theta/T)^2\). Testing at most \(K \le c_3 \log N\) ranked offsets finds a solution; in practice the first admissible already works (Δ_step=0), else a bounded correction (≤2 steps) suffices.

**Consequences.**  
(a) Prime motif: there exists \(\theta^\*\) in \(|\theta|\le T\) with \(c+\theta^\*\) prime.  
(b) Goldbach motif: for even \(E=2c\), there exists \(\theta^\*\) in \(|\theta|\le T\) with both \(c-\theta^\*\) and \(c+\theta^\*\) prime; hence \(E=(c-\theta^\*)+(c+\theta^\*)\).

---

## 2) Algorithm (one page)
Input: center \(c\), motif \(H\), constants \(c_1,c_2,\lambda\).

1. Compute \(\log N\); set \(P = \lfloor c_1 \log N \rfloor\), \(T = \lfloor c_2 (\log N)^2 \rfloor\).  
2. Build the small-prime sieve up to \(P\).  
3. Enumerate offsets \(|\theta| \le T\); keep those admissible for all \(s \le P\).  
4. Rank survivors by \(\Sigma = A + \lambda W\).  
5. Test candidates in that order; stop on the first success. In practice Δ_step ∈ {0,1,2}.

Cost: \(O((\log N)^3)\) for sieving + a handful of primality tests.

---

## 3) Annex — Expanded Examples (20 cases)
**Prime Equation (10):** see Annex in the repository home page.  
**Goldbach (10):** see Annex in the repository home page.

These show that the first admissible = actual offset in most cases (Δ_step = 0), and when not, the correction is ≤ 2.

---

## 4) Practical notes
- For moderate sizes, in-browser primality works (deterministic MR below 3.4×10^14; beyond that use probabilistic MR or external ECPP/APR-CL).  
- For astronomical inputs such as `10^1000`, the calculator switches to **Log mode** and reports predicted \(P, T\) and expected Δ_step without attempting primality in-browser.

---

## 5) Conclusion
Goldbach is not an exception but the symmetric case of a single prime law. A finite sieve, a central window, and a tiny correction suffice to land on the prime(s) with \(O((\log N)^3)\) preprocessing. This converts decades of heuristic insight into an explicit, reproducible method.

— End —
