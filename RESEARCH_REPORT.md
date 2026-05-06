# RESEARCH REPORT: INTELLIGENT TUTORING SYSTEM (ITS)
## For Zimbabwean Primary School Learners

**Student Name:** Never Nyamvura  
**Institution:** Zimbabwe Open University  
**Faculty:** Technology  
**Course:** BITH480 / Capstone Project  

---

### ABSTRACT
This project presents an AI-powered Intelligent Tutoring System (ITS) designed specifically for Grade 3-7 learners in Zimbabwe. The system addresses the gap in personalized instruction caused by high teacher-to-pupil ratios. By leveraging Google's Gemini AI, the system generates adaptive Numeracy and Literacy content contextualized to the Zimbabwean environment (local names, places, and currency). Built using React, Node.js, and a MySQL (WAMP) database, the system serves as a software artifact developed through Design Science Research (DSR) to improve learning outcomes through real-time feedback and progress tracking.

---

### CHAPTER I: INTRODUCTION

#### 1.1 Introduction
In the current Zimbabwean educational landscape, primary schools face significant challenges in delivering quality, personalized instruction. With traditional teaching methods, individual learner attention is often impossible. This research introduces "ZimPrimary ITS," an AI-driven tool developed to act as a one-on-one tutor that adapts to each child's pace.

#### 1.2 Background to the Study
Research shows that one-on-one tutoring significantly improves learning outcomes. However, in Zimbabwe, primary pupils rely on group instruction where many learners fall behind. While global ITS platforms exist, few are tailored to the Zimbabwean curriculum or infrastructure. This project fills that gap by providing a locally contextualized prototype.

#### 1.3 Statement of the Problem
Primary school learners in Zimbabwe receive uniform instruction despite varying learning abilities and levels. The absence of an affordable, automated platform to identify individual gaps in real-time leads to cumulative learning deficits.

#### 1.3.1 Research Questions
- How effectively can AI generate culturally relevant educational content for Zimbabwean learners?
- To what extent does real-time AI feedback improve student engagement compared to traditional homework?
- Can a web-based ITS function reliably within local infrastructure constraints?

#### 1.4 Justification of the Research
1.  **Gap in Research:** No widely used ITS exists that uses the Zimbabwean Grade 3-7 syllabus for AI generation.
2.  **Societal Benefit:** Improves literacy and numeracy, the bedrock of all future learning.
3.  **Methodological Contribution:** Demonstrates the application of Design Science Research in creating educational artifacts for developing nations.

---

### CHAPTER III: RESEARCH METHODOLOGY

#### 3.1 Design Science Research (DSR)
This project adopts the **Design Science Research** paradigm. DSR is a problem-solving approach that seeks to enhance human knowledge through the creation of an innovative artifact.

**The Six Steps of DSR applied here:**
1.  **Problem Identification:** High teacher-pupil ratios in Zimbabwean schools.
2.  **Objectives of the Solution:** Create an adaptive, automated tutor.
3.  **Design and Development:** Building the web application using React and TypeScript.
4.  **Demonstration:** Using the ITS prototype to generate Numeracy/Literacy challenges.
5.  **Evaluation:** Testing the system's ability to adjust difficulty levels based on score performance.
6.  **Communication:** Documenting the process through this research report.

#### 3.2 Technical Architecture
- **Frontend:** React with Tailwind CSS (for highly responsive, mobile-friendly UI).
- **Intelligence Layer:** Google Gemini AI (for real-time question generation and warm feedback).
- **Backend/Database:** Python (Flask) connected to a **WAMP Server (MySQL)** to persist student profiles, scores, and achievements.

---

### CHAPTER IV: SYSTEM FEATURES & IMPLEMENTATION

#### 4.1 AI-Powered Adaptivity
The system does not use a fixed question bank. Instead, it uses **Prompt Engineering** to instruct the Gemini AI to generate questions that:
- Mention local names (Tinashe, Chipo).
- Use local currency (ZiG).
- Reference Zimbabwean geography.

#### 4.2 Achievement & Gamification
To maintain engagement (as highlighted in slide 1.5 of the proposal), the system includes:
- **XP Points:** 20 points per correct answer.
- **Leveling:** Automatic level-up if a student gets 5/5 in a session.
- **Awards:** "First Step" and "Century" badges stored in the MySQL database.

#### 4.3 Database Schema (MySQL)
The system tracks progress across three main tables:
1.  `students`: Identity and current levels.
2.  `performance_logs`: History of every completed session.
3.  `achievements`: Record of unlocked digital badges.

---

### CHAPTER V: CONCLUSION & RECOMMENDATIONS

#### 5.1 Conclusion
The ZimPrimary ITS proves that AI can be successfully integrated into the Zimbabwean primary education system to provide low-cost, personalized tutoring. The artifact developed fulfills the objectives of providing adaptive content and identifying student gaps through data logs.

#### 5.2 Recommendations
1.  **Offline Support:** Future versions should implement more robust service workers for areas with erratic internet.
2.  **Teacher Dashboard:** A secondary interface should be developed for teachers to monitor an entire class's progress via the WAMP database.
3.  **Curriculum Alignment:** Deep integration with the Ministry of Primary and Secondary Education (MoPSE) competence-based curriculum scripts.
