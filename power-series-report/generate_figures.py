#!/usr/bin/env python3
"""Generate figures for the Power Series engineering report."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch

OUT = Path(__file__).resolve().parent / "figures"
OUT.mkdir(parents=True, exist_ok=True)

# Clean academic style
plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 11,
        "axes.titlesize": 13,
        "axes.labelsize": 11,
        "figure.facecolor": "white",
        "axes.facecolor": "#fafbfc",
        "axes.grid": True,
        "grid.alpha": 0.35,
        "grid.linestyle": "--",
        "axes.spines.top": False,
        "axes.spines.right": False,
    }
)


def save(fig, name: str) -> None:
    path = OUT / name
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"saved {path}")


def fig_taylor_sin():
    """Taylor approximations of sin(x)."""
    x = np.linspace(-2 * np.pi, 2 * np.pi, 600)
    y = np.sin(x)

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    ax.plot(x, y, color="#1a365d", linewidth=2.4, label=r"$\sin(x)$")

    colors = ["#c05621", "#2b6cb0", "#276749", "#805ad5"]
    orders = [1, 3, 5, 7]
    for n, c in zip(orders, colors):
        approx = np.zeros_like(x)
        sign = 1
        for k in range((n + 1) // 2):
            p = 2 * k + 1
            approx += sign * (x**p) / np.math.factorial(p)
            sign *= -1
        ax.plot(x, approx, color=c, linewidth=1.6, label=f"Taylor order {n}")

    ax.set_ylim(-2.2, 2.2)
    ax.set_xlim(-2 * np.pi, 2 * np.pi)
    ax.set_xlabel("x (radians)")
    ax.set_ylabel("y")
    ax.set_title("Power Series Approximations of sin(x)")
    ax.legend(loc="upper right", framealpha=0.95)
    ax.axhline(0, color="#718096", linewidth=0.8)
    ax.axvline(0, color="#718096", linewidth=0.8)
    save(fig, "taylor_sin.png")


def fig_radius_of_convergence():
    """Geometric series and radius of convergence."""
    x = np.linspace(-1.8, 1.8, 500)
    # Sum of geometric series 1/(1-x) for |x|<1
    true = 1 / (1 - x)

    fig, axes = plt.subplots(1, 2, figsize=(9.2, 4.2))

    ax = axes[0]
    ax.plot(x, true, color="#1a365d", linewidth=2.2, label=r"$1/(1-x)$")
    for n, c in zip([2, 5, 10, 20], ["#c05621", "#2b6cb0", "#276749", "#805ad5"]):
        s = np.zeros_like(x)
        for k in range(n + 1):
            s += x**k
        ax.plot(x, s, color=c, linewidth=1.4, label=f"Partial sum N={n}")
    ax.axvline(-1, color="#e53e3e", linestyle=":", linewidth=1.5)
    ax.axvline(1, color="#e53e3e", linestyle=":", linewidth=1.5)
    ax.set_xlim(-1.6, 1.6)
    ax.set_ylim(-2, 6)
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_title(r"Geometric Series $\sum x^n$")
    ax.legend(fontsize=8, loc="upper left")

    ax = axes[1]
    # Visual radius of convergence on complex plane / real line
    theta = np.linspace(0, 2 * np.pi, 300)
    R = 1.0
    ax.fill(R * np.cos(theta), R * np.sin(theta), color="#bee3f8", alpha=0.7, label="|x-a| < R (converges)")
    ax.plot(R * np.cos(theta), R * np.sin(theta), color="#2b6cb0", linewidth=2.2, label="Radius R = 1")
    ax.plot([-2, 2], [0, 0], color="#4a5568", linewidth=0.9)
    ax.plot([0, 0], [-2, 2], color="#4a5568", linewidth=0.9)
    ax.scatter([0], [0], color="#1a365d", s=60, zorder=5, label="Center a = 0")
    ax.set_aspect("equal")
    ax.set_xlim(-1.8, 1.8)
    ax.set_ylim(-1.8, 1.8)
    ax.set_xlabel("Re(z)")
    ax.set_ylabel("Im(z)")
    ax.set_title("Radius of Convergence (Complex Plane)")
    ax.legend(fontsize=8, loc="upper right")

    fig.suptitle("Convergence of Power Series", fontsize=14, fontweight="bold", y=1.02)
    fig.tight_layout()
    save(fig, "radius_convergence.png")


def fig_beam_deflection():
    """Cantilever beam deflection via series / polynomial model."""
    L = 1.0  # m
    x = np.linspace(0, L, 200)
    # Exact Euler-Bernoulli cantilever with tip load: v = (P/(6EI))(3Lx^2 - x^3)
    # Normalized shape
    exact = 3 * x**2 - x**3
    exact /= exact.max()

    # Truncated polynomial / series terms that build the deflection shape
    term1 = x**2
    term1 /= term1.max()
    term2 = 3 * x**2 - x**3
    term2 /= term2.max()

    fig, ax = plt.subplots(figsize=(8.2, 4.4))
    ax.plot(x, -exact, color="#1a365d", linewidth=2.6, label="Exact deflection shape")
    ax.plot(x, -term1 / term1.max() * exact.max() / exact.max(), color="#c05621",
            linewidth=1.6, linestyle="--", label="Leading series term ~ x²")
    # show partial polynomial build-up
    approx_low = (3 * x**2) / (3)
    approx_low = approx_low / approx_low.max()
    ax.plot(x, -approx_low, color="#2b6cb0", linewidth=1.6, linestyle=":",
            label="2nd-order truncation")
    ax.plot(x, -exact, color="#276749", linewidth=0)  # keep legend spacing

    # Beam sketch at top
    ax.axhline(0, color="#718096", linewidth=2.2, alpha=0.5)
    ax.fill_between(x, 0, -exact, color="#ebf8ff", alpha=0.8)

    ax.set_xlabel("Position along beam, x / L")
    ax.set_ylabel("Normalized deflection v(x)")
    ax.set_title("Cantilever Beam: Power-Series Form of Deflection")
    ax.legend(loc="lower left")
    ax.set_xlim(0, 1)
    ax.text(0.02, 0.08, "Fixed\nend", transform=ax.transAxes, fontsize=9, color="#4a5568")
    ax.text(0.88, 0.55, "Free end\n(tip load)", transform=ax.transAxes, fontsize=9, color="#4a5568")
    save(fig, "beam_deflection.png")


def fig_rlc_transient():
    """Series RLC transient as exponential / power-series friendly ODE solution."""
    t = np.linspace(0, 0.01, 500)
    R, L, C = 20.0, 0.05, 100e-6
    alpha = R / (2 * L)
    omega0 = 1 / np.sqrt(L * C)
    wd = np.sqrt(omega0**2 - alpha**2)
    # Underdamped current response i(t) = A e^{-αt} sin(ωd t)
    A = 1.0
    i_exact = A * np.exp(-alpha * t) * np.sin(wd * t)

    # Maclaurin-style truncated expansion of the response near t=0
    # Using successive derivatives numerically via known series of exp and sin
    def series_approx(t, n_terms=6):
        # Expand e^{-αt} sin(ωd t) via product of series
        # e^{-αt} = sum (-αt)^k / k!
        # sin(ωd t) = sum (-1)^m (ωd t)^{2m+1} / (2m+1)!
        result = np.zeros_like(t, dtype=float)
        # Use Taylor of whole function via finite product truncation
        exp_s = np.zeros_like(t)
        sin_s = np.zeros_like(t)
        for k in range(n_terms):
            exp_s += ((-alpha * t) ** k) / np.math.factorial(k)
        for m in range(n_terms):
            sin_s += ((-1) ** m) * (wd * t) ** (2 * m + 1) / np.math.factorial(2 * m + 1)
        return A * exp_s * sin_s

    fig, ax = plt.subplots(figsize=(8.2, 4.5))
    ax.plot(t * 1000, i_exact, color="#1a365d", linewidth=2.4, label="Exact underdamped i(t)")
    for n, c in zip([3, 5, 8], ["#c05621", "#2b6cb0", "#276749"]):
        ax.plot(t * 1000, series_approx(t, n), color=c, linewidth=1.5,
                label=f"Power-series approx (N={n})")

    ax.set_xlabel("Time t (ms)")
    ax.set_ylabel("Current i(t) (A, normalized)")
    ax.set_title("Series RLC Circuit Transient via Power Series")
    ax.legend(loc="upper right", fontsize=9)
    ax.set_xlim(0, 10)
    save(fig, "rlc_transient.png")


def fig_error_vs_order():
    """Approximation error vs number of terms."""
    x0 = 1.0
    true = np.exp(x0)
    ns = np.arange(0, 15)
    errs = []
    s = 0.0
    for n in ns:
        s += (x0**n) / np.math.factorial(n)
        errs.append(abs(true - s))

    fig, ax = plt.subplots(figsize=(7.6, 4.2))
    ax.semilogy(ns, errs, "o-", color="#2b6cb0", linewidth=2, markersize=7)
    ax.set_xlabel("Number of terms N")
    ax.set_ylabel(r"Absolute error $|e^x - s_N(x)|$ at x=1")
    ax.set_title("Truncation Error Decreases with More Terms")
    ax.set_xticks(ns)
    save(fig, "error_vs_order.png")


def fig_workflow():
    """Simple flowchart-style engineering workflow diagram."""
    fig, ax = plt.subplots(figsize=(8.5, 3.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4)
    ax.axis("off")

    boxes = [
        (0.4, 1.3, "Physical\nProblem"),
        (2.7, 1.3, "Governing\nODE / PDE"),
        (5.0, 1.3, "Assume Power\nSeries Solution"),
        (7.3, 1.3, "Coefficients\n& Truncation"),
    ]
    for x, y, text in boxes:
        patch = FancyBboxPatch(
            (x, y), 1.9, 1.5,
            boxstyle="round,pad=0.05,rounding_size=0.15",
            linewidth=1.6,
            edgecolor="#1a365d",
            facecolor="#ebf8ff",
        )
        ax.add_patch(patch)
        ax.text(x + 0.95, y + 0.75, text, ha="center", va="center", fontsize=10, color="#1a365d")

    for x in [2.35, 4.65, 6.95]:
        ax.annotate("", xy=(x + 0.3, 2.05), xytext=(x, 2.05),
                    arrowprops=dict(arrowstyle="->", color="#2b6cb0", lw=2))

    ax.text(5, 3.5, "Engineering Workflow: Solving with Power Series",
            ha="center", fontsize=13, fontweight="bold", color="#1a365d")
    ax.text(5, 0.45, "Validate against boundary conditions → deploy numerical / design model",
            ha="center", fontsize=10, color="#4a5568")
    save(fig, "workflow.png")


if __name__ == "__main__":
    # np.math.factorial is deprecated path; use math.factorial via numpy compatibility
    import math

    np.math = type("M", (), {"factorial": math.factorial})()  # lightweight shim
    fig_taylor_sin()
    fig_radius_of_convergence()
    fig_beam_deflection()
    fig_rlc_transient()
    fig_error_vs_order()
    fig_workflow()
    print("All figures generated.")
