#!/usr/bin/env python3
"""Build an English PDF report on Power Series for engineering students."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

ROOT = Path(__file__).resolve().parent
FIG = ROOT / "figures"
OUT = Path("/opt/cursor/artifacts/Power_Series_Engineering_Report.pdf")
OUT_LOCAL = ROOT / "Power_Series_Engineering_Report.pdf"

NAVY = colors.HexColor("#1a365d")
BLUE = colors.HexColor("#2b6cb0")
SLATE = colors.HexColor("#4a5568")
LIGHT = colors.HexColor("#ebf8ff")
ACCENT = colors.HexColor("#c05621")


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=13,
            leading=18,
            textColor=SLATE,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=BLUE,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            textColor=colors.HexColor("#1a202c"),
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "caption": ParagraphStyle(
            "caption",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            textColor=SLATE,
            alignment=TA_CENTER,
            spaceBefore=4,
            spaceAfter=12,
        ),
        "formula": ParagraphStyle(
            "formula",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceBefore=6,
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            textColor=colors.HexColor("#1a202c"),
            leftIndent=8,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=SLATE,
            alignment=TA_CENTER,
        ),
        "toc": ParagraphStyle(
            "toc",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=18,
            textColor=NAVY,
            leftIndent=10,
        ),
    }
    return styles


def add_page_number(canvas, doc):
    canvas.saveState()
    page = canvas.getPageNumber()
    if page > 1:
        canvas.setStrokeColor(BLUE)
        canvas.setLineWidth(0.6)
        canvas.line(2 * cm, A4[1] - 1.4 * cm, A4[0] - 2 * cm, A4[1] - 1.4 * cm)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(NAVY)
        canvas.drawString(2 * cm, A4[1] - 1.15 * cm, "Power Series in Engineering")
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(SLATE)
        canvas.drawRightString(A4[0] - 2 * cm, A4[1] - 1.15 * cm, "Technical Report")

        canvas.setStrokeColor(colors.HexColor("#cbd5e0"))
        canvas.line(2 * cm, 1.3 * cm, A4[0] - 2 * cm, 1.3 * cm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(SLATE)
        canvas.drawCentredString(A4[0] / 2, 0.8 * cm, f"Page {page}")
    canvas.restoreState()


def img(name: str, width=15.5 * cm):
    path = FIG / name
    # preserve aspect roughly for typical plots
    return Image(str(path), width=width, height=width * 0.55)


def build():
    styles = make_styles()
    story = []

    # ----- Cover -----
    story.append(Spacer(1, 3.2 * cm))
    story.append(HRFlowable(width="80%", thickness=2, color=NAVY, spaceBefore=0, spaceAfter=12, hAlign="CENTER"))
    story.append(Paragraph("POWER SERIES", styles["cover_title"]))
    story.append(Paragraph("Theory, Convergence, and Engineering Applications", styles["cover_sub"]))
    story.append(HRFlowable(width="80%", thickness=1, color=BLUE, spaceBefore=4, spaceAfter=18, hAlign="CENTER"))
    story.append(Paragraph("A Technical Report with Worked Engineering Examples", styles["cover_sub"]))
    story.append(Spacer(1, 1.2 * cm))

    cover_meta = [
        ["Subject", "Engineering Mathematics / Applied Analysis"],
        ["Focus", "Power series, Taylor expansions, ODE solutions"],
        ["Applications", "Structural beams, RLC circuits, numerical design"],
        ["Language", "English"],
        ["Document type", "Illustrated technical report (PDF)"],
    ]
    t = Table(cover_meta, colWidths=[4.2 * cm, 10 * cm])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#a0aec0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 2.2 * cm))
    story.append(Paragraph("Prepared for academic and engineering practice use.", styles["cover_sub"]))
    story.append(Paragraph("Includes diagrams, convergence plots, and applied case studies.", styles["cover_sub"]))
    story.append(PageBreak())

    # ----- TOC -----
    story.append(Paragraph("Contents", styles["h1"]))
    toc_items = [
        "1. Introduction",
        "2. Mathematical Foundations of Power Series",
        "3. Convergence and Truncation Error",
        "4. Taylor and Maclaurin Series",
        "5. Engineering Workflow with Power Series",
        "6. Practical Application I — Cantilever Beam Deflection",
        "7. Practical Application II — Series RLC Circuit Transient",
        "8. Discussion and Design Guidelines",
        "9. Conclusion",
        "10. References",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles["toc"]))
    story.append(PageBreak())

    # ----- 1. Introduction -----
    story.append(Paragraph("1. Introduction", styles["h1"]))
    story.append(
        Paragraph(
            "A <b>power series</b> is an infinite sum of the form "
            "<font face='Courier'>Σ aₙ(x − a)ⁿ</font> from n = 0 to infinity. "
            "It represents a function as a polynomial of unbounded degree centered at a point a. "
            "In engineering, power series are not only a theoretical tool from calculus; they are a "
            "practical language for approximating nonlinear relations, solving differential equations, "
            "linearizing models for control design, and building efficient numerical algorithms.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "Engineers routinely replace complicated expressions—such as trigonometric relations in "
            "robotics, exponential decays in circuits, or transcendental transfer functions—with a few "
            "leading terms of a series. The quality of that approximation depends on the radius of "
            "convergence, the size of the remainder, and the operating range of the physical system.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "This report introduces the core theory of power series, illustrates convergence visually, "
            "and then develops two concrete engineering applications: (1) the polynomial structure of "
            "beam deflection in solid mechanics, and (2) a power-series treatment of the transient "
            "current in a series RLC circuit.",
            styles["body"],
        )
    )

    # ----- 2. Foundations -----
    story.append(Paragraph("2. Mathematical Foundations of Power Series", styles["h1"]))
    story.append(Paragraph("2.1 Definition", styles["h2"]))
    story.append(
        Paragraph(
            "The general power series centered at <font face='Courier'>a</font> is written as:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "f(x) = a₀ + a₁(x − a) + a₂(x − a)² + a₃(x − a)³ + … = Σ<sub>n=0</sub><super>∞</super> aₙ (x − a)ⁿ",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "When a = 0, the series is called a <b>Maclaurin series</b>. The coefficients aₙ are "
            "determined by the derivatives of f at the expansion point when f is sufficiently smooth:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "aₙ = f⁽ⁿ⁾(a) / n!",
            styles["formula"],
        )
    )

    story.append(Paragraph("2.2 Why Power Series Matter in Engineering", styles["h2"]))
    bullets = [
        "They convert differential equations into algebraic recurrence relations for coefficients.",
        "They provide local polynomial surrogates for expensive nonlinear simulations.",
        "They quantify sensitivity and small-signal behavior around an operating point.",
        "They underpin many numerical methods (series solutions, Padé approximants, asymptotic expansions).",
    ]
    for b in bullets:
        story.append(Paragraph(f"• {b}", styles["bullet"]))
    story.append(Spacer(1, 6))

    # ----- 3. Convergence -----
    story.append(Paragraph("3. Convergence and Truncation Error", styles["h1"]))
    story.append(
        Paragraph(
            "A power series does not necessarily converge for every x. There exists a value R ≥ 0, "
            "called the <b>radius of convergence</b>, such that the series converges absolutely for "
            "|x − a| &lt; R and diverges for |x − a| &gt; R. On the boundary |x − a| = R, convergence "
            "must be checked case by case.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "The classic geometric series Σ xⁿ converges to 1/(1 − x) for |x| &lt; 1. Outside that "
            "disk the partial sums fail, which is exactly what engineers must avoid when truncating "
            "models outside their validated range.",
            styles["body"],
        )
    )
    story.append(img("radius_convergence.png"))
    story.append(
        Paragraph(
            "Figure 1. Left: partial sums of the geometric series approaching 1/(1 − x) inside |x| &lt; 1. "
            "Right: the disk of convergence in the complex plane with radius R = 1.",
            styles["caption"],
        )
    )
    story.append(
        Paragraph(
            "When a series is truncated after N terms, the leftover is the <b>truncation error</b>. "
            "For analytic functions such as eˣ, the error typically falls factorially fast near the "
            "expansion point, which is why low-order Taylor models are so effective in design.",
            styles["body"],
        )
    )
    story.append(img("error_vs_order.png", width=13.5 * cm))
    story.append(
        Paragraph(
            "Figure 2. Absolute truncation error of the Maclaurin series for eˣ at x = 1 as the number "
            "of terms increases (log scale).",
            styles["caption"],
        )
    )

    # ----- 4. Taylor -----
    story.append(Paragraph("4. Taylor and Maclaurin Series", styles["h1"]))
    story.append(
        Paragraph(
            "Common engineering building blocks have well-known expansions. For example:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "sin(x) = x − x³/3! + x⁵/5! − x⁷/7! + …",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "cos(x) = 1 − x²/2! + x⁴/4! − x⁶/6! + …",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "eˣ = 1 + x + x²/2! + x³/3! + …",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "These expansions are the mathematical basis of the small-angle approximation "
            "sin(θ) ≈ θ used in pendulum linearization, antenna pointing, and vibration analysis. "
            "Figure 3 shows how successive odd-order Taylor polynomials recover sin(x) over a wider interval.",
            styles["body"],
        )
    )
    story.append(img("taylor_sin.png"))
    story.append(
        Paragraph(
            "Figure 3. Taylor polynomials of orders 1, 3, 5, and 7 approximating sin(x).",
            styles["caption"],
        )
    )

    # ----- 5. Workflow -----
    story.append(Paragraph("5. Engineering Workflow with Power Series", styles["h1"]))
    story.append(
        Paragraph(
            "In applied work, the series method usually follows a repeatable workflow: start from a "
            "physical law, write the governing differential equation, assume a power-series form for "
            "the unknown, compute coefficients from initial/boundary data, truncate wisely, and validate.",
            styles["body"],
        )
    )
    story.append(img("workflow.png", width=15.8 * cm))
    story.append(
        Paragraph(
            "Figure 4. Typical workflow for deploying power-series solutions in engineering analysis.",
            styles["caption"],
        )
    )
    story.append(PageBreak())

    # ----- 6. Beam -----
    story.append(Paragraph("6. Practical Application I — Cantilever Beam Deflection", styles["h1"]))
    story.append(Paragraph("6.1 Problem Statement", styles["h2"]))
    story.append(
        Paragraph(
            "Consider a cantilever beam of length L, flexural rigidity EI, fixed at x = 0 and free at "
            "x = L, subjected to a tip load P. From Euler–Bernoulli beam theory, the deflection v(x) "
            "satisfies:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "EI v''''(x) = 0   (no distributed load along the span)",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "with boundary conditions v(0) = 0, v'(0) = 0, M(L) = 0, and shear V(L) = −P. Integrating "
            "four times yields a cubic polynomial—itself a finite power series:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "v(x) = (P / (6 EI)) (3 L x² − x³)",
            styles["formula"],
        )
    )
    story.append(Paragraph("6.2 Series Interpretation", styles["h2"]))
    story.append(
        Paragraph(
            "Even though the exact solution is a short polynomial, the same idea extends to more "
            "complex loading, variable stiffness, or nonlinear foundations: one assumes "
            "v(x) = Σ cₙ xⁿ, substitutes into the differential equation, and solves for the "
            "coefficients. Truncation then becomes a controllable approximation of the deflection shape.",
            styles["body"],
        )
    )
    story.append(img("beam_deflection.png"))
    story.append(
        Paragraph(
            "Figure 5. Normalized cantilever deflection. The exact cubic shape is built from successive "
            "polynomial (power-series) terms; low-order truncations capture the qualitative bending early.",
            styles["caption"],
        )
    )
    story.append(Paragraph("6.3 Engineering Takeaways", styles["h2"]))
    for b in [
        "Tip deflection scales as P L³ / (3 EI); series coefficients encode stiffness and load.",
        "Polynomial / series bases are natural for finite-element shape functions.",
        "For non-uniform beams, recurrence relations from a series ansatz remain computationally light.",
        "Always enforce geometric boundary conditions before trusting truncated coefficients.",
    ]:
        story.append(Paragraph(f"• {b}", styles["bullet"]))
    story.append(Spacer(1, 8))

    # ----- 7. RLC -----
    story.append(Paragraph("7. Practical Application II — Series RLC Circuit Transient", styles["h1"]))
    story.append(Paragraph("7.1 Governing Equation", styles["h2"]))
    story.append(
        Paragraph(
            "A series RLC circuit with resistance R, inductance L, and capacitance C obeys:",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "L i''(t) + R i'(t) + (1/C) i(t) = 0",
            styles["formula"],
        )
    )
    story.append(
        Paragraph(
            "For underdamped parameters, the exact current has the form "
            "i(t) = A e^{−αt} sin(ω_d t), where α = R/(2L) and ω_d = √(ω₀² − α²) with ω₀ = 1/√(LC). "
            "Near t = 0, both the exponential and the sine factors admit power-series expansions; "
            "their product yields a practical local series for early-time circuit response.",
            styles["body"],
        )
    )
    story.append(Paragraph("7.2 Power-Series Approximation", styles["h2"]))
    story.append(
        Paragraph(
            "Expanding e^{−αt} and sin(ω_d t) and multiplying truncated series produces a polynomial "
            "surrogate for i(t). This is useful for symbolic design, embedded real-time estimators, "
            "and educational verification against the closed-form solution.",
            styles["body"],
        )
    )
    story.append(img("rlc_transient.png"))
    story.append(
        Paragraph(
            "Figure 6. Exact underdamped RLC current compared with power-series approximations using "
            "N = 3, 5, and 8 terms. Accuracy improves rapidly near t = 0 as more terms are retained.",
            styles["caption"],
        )
    )
    story.append(Paragraph("7.3 Practical Design Notes", styles["h2"]))
    for b in [
        "Use series models for short prediction horizons; switch to the closed form or numerical ODE solvers for long transients.",
        "Coefficient growth and the damping rate α determine how many terms are needed for a target error.",
        "The same approach applies to mechanical second-order systems (mass–spring–damper) by analogy.",
        "Series expansions also help derive small-signal transfer-function approximations for control tuning.",
    ]:
        story.append(Paragraph(f"• {b}", styles["bullet"]))

    story.append(PageBreak())

    # ----- 8. Discussion -----
    story.append(Paragraph("8. Discussion and Design Guidelines", styles["h1"]))
    story.append(
        Paragraph(
            "Across mechanical and electrical examples, power series succeed when three conditions hold: "
            "(1) the expansion point is close to the operating region of interest, (2) enough terms are "
            "kept to meet the error budget, and (3) the truncated model is validated against boundary "
            "data or measurements. Outside the radius of convergence—or far from the expansion "
            "center—series models can diverge catastrophically, so engineers must treat them as "
            "local tools rather than global replacements.",
            styles["body"],
        )
    )

    guidelines = [
        ["Guideline", "Recommendation"],
        ["Choose the center a", "Expand about the steady operating point or initial condition."],
        ["Estimate R", "Use ratio/root tests or known singularities of the closed form."],
        ["Select N", "Increase terms until residual &lt; design tolerance on the working interval."],
        ["Validate", "Compare with exact solution, FEM/SPICE, or lab measurements."],
        ["Deploy", "Embed the truncated polynomial in design formulas or real-time code."],
    ]
    gt = Table(guidelines, colWidths=[4.5 * cm, 11 * cm])
    gt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 1), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#1a202c")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f7fafc")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#a0aec0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(gt)
    story.append(Spacer(1, 10))

    # ----- 9. Conclusion -----
    story.append(Paragraph("9. Conclusion", styles["h1"]))
    story.append(
        Paragraph(
            "Power series provide a unifying bridge between calculus and engineering practice. "
            "They explain why low-order polynomial models work near an operating point, how "
            "truncation error can be monitored, and how differential equations in structures and "
            "circuits can be attacked systematically. The cantilever-beam and RLC examples show that "
            "the same mathematical object—Σ aₙ(x − a)ⁿ—appears both as an exact polynomial solution "
            "and as a controlled local approximation of a transcendental transient.",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "For students and practitioners, the essential habit is to pair every series expansion "
            "with a clear statement of its center, radius, retained order, and validation method. "
            "Used that way, power series remain one of the most reliable tools in applied mathematics "
            "for modeling, design, and computation.",
            styles["body"],
        )
    )

    # ----- 10. References -----
    story.append(Paragraph("10. References", styles["h1"]))
    refs = [
        "Kreyszig, E. Advanced Engineering Mathematics. Wiley.",
        "Boyce, W. E., & DiPrima, R. C. Elementary Differential Equations and Boundary Value Problems. Wiley.",
        "Nilsson, J. W., & Riedel, S. Electric Circuits. Pearson.",
        "Hibbeler, R. C. Mechanics of Materials. Pearson.",
        "Zill, D. G. A First Course in Differential Equations with Modeling Applications. Cengage.",
    ]
    for i, r in enumerate(refs, 1):
        story.append(Paragraph(f"[{i}] {r}", styles["bullet"]))

    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceBefore=4, spaceAfter=8))
    story.append(
        Paragraph(
            "End of Report — Power Series: Theory and Engineering Applications",
            styles["caption"],
        )
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=1.8 * cm,
        title="Power Series — Theory and Engineering Applications",
        author="Technical Report",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)

    # also copy locally
    import shutil

    shutil.copy2(OUT, OUT_LOCAL)
    print(f"PDF written to {OUT}")
    print(f"PDF copy at {OUT_LOCAL}")


if __name__ == "__main__":
    build()
