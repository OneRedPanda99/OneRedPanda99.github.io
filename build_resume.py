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
LABEL = ParagraphStyle('LABEL', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=PRIMARY, spaceBefore=8, spaceAfter=2, leading=11)
ROLE = ParagraphStyle('ROLE', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10.5, textColor=DARK, spaceBefore=4, leading=13)
META = ParagraphStyle('META', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, textColor=SUB, spaceAfter=1, leading=11)
BODY = ParagraphStyle('BODY', parent=styles['Normal'], fontName='Helvetica', fontSize=8.8, textColor=DARK, leading=11.8, spaceAfter=1.5)
BULLET = ParagraphStyle('BULLET', parent=BODY, leftIndent=10, spaceAfter=1)

doc = SimpleDocTemplate('resume.pdf', pagesize=letter,
                        leftMargin=0.6*inch, rightMargin=0.6*inch,
                        topMargin=0.5*inch, bottomMargin=0.5*inch,
                        title='Parker Branham | Resume', author='Parker Branham')
E = []

E.append(Paragraph('Parker Branham', H1))
E.append(Paragraph('Columbia, SC &nbsp;·&nbsp; Class of 2027 (Senior) &nbsp;·&nbsp; parkerbranham@gmail.com', SUBHEAD))
E.append(Paragraph('parkerbranham.com &nbsp;|&nbsp; GitHub: OneRedPanda99 &nbsp;|&nbsp; LinkedIn: linkedin.com/in/parker-branham-9b32a5341/', SUBHEAD))
E.append(Paragraph('Planning to study mechatronics engineering. Open to internships, tutoring, and project collaborations.', BODY))
E.append(HRFlowable(width='100%', thickness=1, color=BORDER, spaceBefore=4, spaceAfter=6))

E.append(Paragraph('EDUCATION', LABEL))
E.append(Paragraph('Cardinal Newman School, Columbia, SC', ROLE))
E.append(Paragraph('Graduating May 2027 &nbsp;·&nbsp; GPA 4.34 weighted (SC Uniform Grading Policy), 4.48 junior year', META))
E.append(Paragraph('Coursework: AP English Language (exam score 4), AP English Literature, Physics I Honors, Calculus Honors, '
                   'Pre-Calculus Honors, dual-enrollment French. USC Summer Scholars: robotics and photography.', BODY))

E.append(Paragraph('EXPERIENCE &amp; ACTIVITIES', LABEL))

E.append(Paragraph('Founder &amp; Owner, SC Pressure Point', ROLE))
E.append(Paragraph('Student-owned pressure washing, Columbia, SC &nbsp;·&nbsp; Started at 14; official spring 2026; paused summer 2026', META))
E.append(Paragraph("Started taking jobs at 14 from Facebook referrals. Handled outreach, square-foot quoting, scheduling, and the work itself. "
                   "Hired and trained a crew of three, completed about 20 jobs, and hand-built the business website (scpressurepoint.com) and CRM.", BODY))

E.append(Paragraph('Stage Manager, Cardinal Newman Theater', ROLE))
E.append(Paragraph('2021 – Present', META))
E.append(Paragraph("Backstage crew since 7th grade, Assistant Stage Manager for two years, now Stage Manager. "
                   "Also the theater department's photographer.", BODY))

E.append(Paragraph('Beta Club Robotics', ROLE))
E.append(Paragraph('Cardinal Newman School &nbsp;·&nbsp; 2021 – Present', META))
E.append(Paragraph("Competed every year since 7th grade, building on the REV control system. "
                   "Placed 4th with B.E.R.T., a beach-cleanup robot. It was the school's first placement in six years.", BODY))

E.append(Paragraph('FTC Robotics: Founding Effort', ROLE))
E.append(Paragraph('Cardinal Newman School &nbsp;·&nbsp; 2026 – Present', META))
E.append(Paragraph("Working to start a FIRST Tech Challenge team. Recruited about five students and a faculty advisor; "
                   "working toward school approval. Not yet an official team.", BODY))

E.append(Paragraph('Sales Associate, BeBeep Toys', ROLE))
E.append(Paragraph('2025', META))
E.append(Paragraph("Helped shoppers, gift-wrapped, and ran the register at a local toy store; shared ideas with the owner for the store's website.", BODY))

E.append(Paragraph('Server Administrator, Personal Project', ROLE))
E.append(Paragraph('2019 – Present', META))
E.append(Paragraph("Home-hosted Minecraft server since age 10: static IP, BungeeCord proxy, Java plugins, Bedrock crossplay, and a Discord bot. "
                   "Seven to ten regular players; about 80 members over the years.", BODY))

E.append(Paragraph('Other: Aviation Club spokesperson; Beta Club member.', BODY))

E.append(Paragraph('PROJECTS', LABEL))

E.append(Paragraph('Ghost Light: Theater Set-Change Tracker', ROLE))
E.append(Paragraph("A web app that shows the crew an animated ground plan of which set piece moves where in each scene, with move lists "
                   "computed from scene to scene, a backstage dim mode, and 59 automated tests in CI. Built for my school's theater.", BODY))

E.append(Paragraph('Clearline: Firebase CRM (unfinished)', ROLE))
E.append(Paragraph("A vanilla-JS web app with a Firestore backend that handled customers, jobs, measurements, estimates, and billing "
                   "for SC Pressure Point. Worked through Firestore security rules, an access model, and a repeatable deploy. "
                   "Development stopped when the business paused.", BODY))

E.append(Paragraph('3D Design &amp; Printing; Handwriting Plotter (in progress)', ROLE))
E.append(Paragraph("Fusion 360 CAD and FDM printing, from printed ball bearings to classroom materials. Building a handwriting "
                   "data collector to train a model that writes like me on a pen plotter.", BODY))

E.append(Paragraph('SKILLS', LABEL))
E.append(Paragraph('Fusion 360 / CAD · HTML, CSS, JavaScript · Firebase / Firestore · Java · Python (Flask) · GitHub Pages · '
                   'Networking · Hiring &amp; training · Photography (Canon A-1, Sony A6400)', BODY))

doc.build(E)
print("resume.pdf written")
