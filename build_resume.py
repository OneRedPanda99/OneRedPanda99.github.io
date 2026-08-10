from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem

PRIMARY = colors.HexColor('#2e7d32')
DARK = colors.HexColor('#3e2723')
SUB = colors.HexColor('#6d4c41')
BORDER = colors.HexColor('#e0d6c9')

styles = getSampleStyleSheet()
H1 = ParagraphStyle('H1', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22, textColor=DARK, spaceAfter=2, leading=24)
SUBHEAD = ParagraphStyle('SUBHEAD', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, textColor=SUB, spaceAfter=8)
LABEL = ParagraphStyle('LABEL', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=PRIMARY, spaceBefore=10, spaceAfter=3, leading=11)
ROLE = ParagraphStyle('ROLE', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10.5, textColor=DARK, spaceBefore=6, leading=13)
META = ParagraphStyle('META', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, textColor=SUB, spaceAfter=1, leading=11)
BODY = ParagraphStyle('BODY', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=DARK, leading=12.5, spaceAfter=2)
BULLET = ParagraphStyle('BULLET', parent=BODY, leftIndent=10, spaceAfter=1)

doc = SimpleDocTemplate('resume.pdf', pagesize=letter,
                        leftMargin=0.7*inch, rightMargin=0.7*inch,
                        topMargin=0.6*inch, bottomMargin=0.6*inch,
                        title='Parker Branham — Resume', author='Parker Branham')
E = []

E.append(Paragraph('Parker Branham', H1))
E.append(Paragraph('Columbia, SC &nbsp;·&nbsp; Class of 2027 (Senior) &nbsp;·&nbsp; parkerbranham@gmail.com', SUBHEAD))
E.append(Paragraph('GitHub: github.com/OneRedPanda99 &nbsp;|&nbsp; LinkedIn: linkedin.com/in/parker-branham-9b32a5341/', SUBHEAD))
E.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceBefore=4, spaceAfter=6))

E.append(Paragraph('OPEN TO', LABEL))
E.append(Paragraph('Internships, tutoring, and project collaborations for my senior year (Class of 2027). '
                   'SC Pressure Point is currently paused. Not currently seeking traditional employment.', BODY))

E.append(Paragraph('EDUCATION', LABEL))
E.append(Paragraph('Cardinal Newman High School — Columbia, SC', ROLE))
E.append(Paragraph('Graduating May 2027 &nbsp;·&nbsp; GPA 4.73 (SC Uniform) &nbsp;·&nbsp; Goal: Mechatronics / Engineering', META))

E.append(Paragraph('EXPERIENCE', LABEL))

E.append(Paragraph('FTC Robotics — Founding (Pending)', ROLE))
E.append(Paragraph('Cardinal Newman High School &nbsp;·&nbsp; 2026 – Pending', META))
E.append(Paragraph("Working to start an FTC (FIRST Tech Challenge) team. I'd lead the team — designing, building, "
                   "and programming in Java and Fusion 360 — but the program is still awaiting principal approval and isn't official yet. "
                   "Previously placed 4th at Beta Club Robotics, the first placement for the school in six years.", BODY))

E.append(Paragraph('Web Development — Personal &amp; Casual', ROLE))
E.append(Paragraph('Self-Taught &nbsp;·&nbsp; 2024 – Present', META))
E.append(Paragraph("I build websites for myself and occasionally help others out casually — not a business or advertised service. "
                   "HTML, CSS, and JavaScript, usually hosted on GitHub Pages. This portfolio and scpressurepoint.com are examples.", BODY))

E.append(Paragraph('Founder &amp; Owner — SC Pressure Point', ROLE))
E.append(Paragraph('Student-Owned Pressure Washing &nbsp;·&nbsp; 2024 – Present (currently paused)', META))
E.append(Paragraph("Started at 14 when I couldn't legally be hired. Handled outreach, published sq-ft quotes, scheduling, and job execution. "
                   "Built the business website myself. On hold for senior year.", BODY))

E.append(Paragraph('Employed — Sales Staff', ROLE))
E.append(Paragraph('BeBeep Toys &nbsp;·&nbsp; 2024 – 2025', META))
E.append(Paragraph("Customer-facing retail while continuing gig-based work.", BODY))

E.append(Paragraph('Server Administrator &amp; Developer', ROLE))
E.append(Paragraph('Personal Project &nbsp;·&nbsp; 2020 – Present', META))
E.append(Paragraph("Self-hosted a Minecraft server network (80+ members). Static IP, BungeeCord proxy, Java plugins, Discord bot.", BODY))

E.append(Paragraph('PROJECTS', LABEL))

E.append(Paragraph('Clearline — Firebase CRM', ROLE))
E.append(Paragraph("The most substantial engineering project I've shipped: a Firebase-backed CRM (vanilla-JS PWA) for a real business. "
                   "Real architecture decisions and real bug-fixing — Firestore security rules, a signed-in accessUids access model, "
                   "and a reproducible GitHub Pages deploy.", BODY))

E.append(Paragraph('SC Pressure Point Website', ROLE))
E.append(Paragraph("Full business site: services catalog, published pricing, before/after gallery, quote form. Built and hosted on GitHub Pages.", BODY))

E.append(Paragraph('Fusion 360 Parts', ROLE))
E.append(Paragraph("CAD-designed mechanical components and enclosures.", BODY))

E.append(Paragraph('SKILLS', LABEL))
E.append(Paragraph('Fusion 360 · HTML/CSS/JavaScript · Firebase / Firestore · Java · Robotics (FTC, Beta Club) · '
                   'CAD · GitHub Pages · Network administration · Client &amp; business management · Photography (Canon A1, Sony A6400)', BODY))

doc.build(E)
print("resume.pdf written")
