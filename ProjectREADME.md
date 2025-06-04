# AI-Powered Healthcare Agent System with Doctor & Patient Dashboards

## 1. Overview

This project aims to create an intelligent healthcare support system leveraging a multi-agent n8n workflow. It facilitates patient information gathering, automated medical research and preliminary diagnosis, and presents this information to a doctor for review, discussion, and final decision-making. The system includes dedicated web-based dashboards for doctors and patients, built with a modern tech stack for an aesthetic, interactive, and easy-to-navigate experience.

The core problem this system addresses is streamlining the initial patient intake and diagnostic support process, allowing medical professionals to focus on critical decision-making and patient care by providing them with well-researched and pre-processed information.

## 2. System Architecture

The system is composed of three main components that interact primarily through a central database, ensuring a decoupled and robust architecture:

1.  **n8n Agent Workflow:** A series of automated agents responsible for interaction and data processing.
2.  **PostgreSQL Database:** The central repository for all data, including conversations, user information, medical assessments, and prescriptions.
3.  **Web Application (Dashboards):** Next.js-based frontend providing interfaces for doctors and patients.

**Communication Flow:**

*   Patients interact with the `Patient Chat Agent` (initially via Telegram, with potential for web integration).
*   The `Patient Chat Agent` and `Behind The Scenes Agent` write all relevant data (conversation logs, research findings, preliminary diagnoses, draft prescriptions) to the PostgreSQL database, populating the `cases` and related tables.
*   The `Doctor Chat Agent` retrieves information from the database to present to the doctor and also writes doctor interactions and decisions back to the database.
*   The Doctor and Patient Dashboards read from and write to the PostgreSQL database to display information, facilitate approvals, and manage records.
*   **Crucially, there is no direct communication between the web application (dashboards) and the n8n agents.** All interactions are mediated through the database to maintain system stability and modularity.

## 3. Technology Stack

Here's a breakdown of the technologies used and their roles:

### 3.1. Backend (n8n Workflow Automation)

*   **n8n:**
    *   **Role:** Core orchestration engine for the automated agent workflows. Manages the sequence of operations, data transformation, and external service integrations for the agents.
    *   **Agents:**
        1.  **Patient Chat Agent:** Responsible for initial interaction with patients, gathering symptoms, medical history, and other relevant information.
        2.  **Behind The Scenes Agent:** Takes the complete conversation history, performs automated research (e.g., querying medical knowledge bases), generates preliminary diagnostic suggestions, and drafts potential prescriptions.
        3.  **Doctor Chat Agent:** Presents the consolidated information (from the patient and the Behind The Scenes agent) to the doctor via a chat interface. It facilitates discussion, incorporates doctor feedback, and records the doctor's final decisions.

### 3.2. Database

*   **PostgreSQL:**
    *   **Role:** Primary data store for the entire system.
    *   **Justification:**
        *   **Relational Integrity:** Essential for accurately linking patients, doctors, cases, and medical records.
        *   **JSONB Support:** Allows for flexible storage of semi-structured data like patient personal info, agent research, or FAQs within a relational structure.
        *   **Security Features:** Robust access control, encryption capabilities, and tools to support HIPAA compliance.
        *   **Scalability & Reliability:** Proven to handle demanding workloads and ensure data durability (ACID compliance).

### 3.3. Frontend (Web Application & Dashboards)

*   **Next.js (Version 15 or latest stable):**
    *   **Role:** Full-stack React framework for building the patient and doctor dashboards.
    *   **Justification:**
        *   **Server-Side Rendering (SSR) & Static Site Generation (SSG):** For optimal performance and SEO.
        *   **App Router:** Modern routing solution for building complex, navigable interfaces.
        *   **API Routes/Server Actions:** Can be used to create backend endpoints for the frontend to securely interact with the database.
        *   **Developer Experience:** Rich ecosystem and strong community support.
*   **Shadcn/ui:**
    *   **Role:** UI component library.
    *   **Justification:** Provides beautifully designed, accessible, and customizable components that can be easily integrated into the Next.js application. This accelerates UI development while ensuring a high-quality, aesthetic, and interactive user experience.
*   **TypeScript:**
    *   **Role:** Adds static typing to JavaScript.
    *   **Justification:** Improves code quality, maintainability, and reduces runtime errors, especially crucial for an application handling sensitive data.

### 3.4. API Layer (Implicit or Explicit)

*   **Next.js API Routes / Express.js (Optional):**
    *   **Role:** If not using direct database connections from Next.js server components or server actions, a dedicated API layer will handle CRUD operations and business logic between the frontend dashboards and the PostgreSQL database.
    *   **Justification:** Enforces separation of concerns, provides a clear interface for data access, and can centralize business logic and security checks.

### 3.5. Security

*   **JWT (JSON Web Tokens):** For stateless authentication of users accessing the dashboards.
*   **RBAC (Role-Based Access Control):** To ensure doctors and patients can only access data and functionalities appropriate to their roles.
*   **HTTPS/SSL:** For encrypting data in transit between clients and the server.
*   **Database Encryption (At Rest & In Transit):** PostgreSQL offers features to encrypt sensitive patient data.

## 4. Database Structure (Schema aligned with provided image)

This schema aims to closely model the structure you envisioned, using PostgreSQL features like JSONB for flexibility where appropriate.

### `patients` Table
Stores information about each patient.
*   `patient_id SERIAL PRIMARY KEY`
*   `personal_info JSONB` (Stores fields like `name`, `age`, contact details, etc., as a JSON object)
*   `medical_history_text TEXT` (For general medical history notes, e.g., "liver disease")
*   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
*   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `doctors` Table
Stores information about each doctor.
*   `doctor_id SERIAL PRIMARY KEY`
*   `name VARCHAR(255) NOT NULL`
*   `age INTEGER` (Or consider `date_of_birth DATE`)
*   `speciality VARCHAR(255)`
*   `contact_info JSONB` (e.g., email, phone - ensure sensitive data handling)
*   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
*   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `cases` Table
Represents an individual interaction or medical case for a patient, handled by the agent system and doctors.
*   `case_id SERIAL PRIMARY KEY`
*   `patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE`
*   `assigned_doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE SET NULL` (Doctor assigned to oversee/approve the case)
*   `transcript TEXT` (Full conversation log with the patient/agents)
*   `summary TEXT` (Agent-generated or doctor-provided summary of the case)
*   `research_details JSONB` (Stores agent's findings: `{"diagnosis_suggestion": "...", "research_notes": "...", "suggested_speciality": "..."}`)
*   `faq JSONB` (Stores Q&A pairs related to the case, e.g., `[{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}]`)
*   `approval_status VARCHAR(50) DEFAULT 'Pending'` (e.g., 'Pending Review', 'Approved by Doctor', 'Rejected', 'Information Requested')
*   `is_completed BOOLEAN DEFAULT FALSE`
*   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
*   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    *   *Note on "Approval History":* While `approval_status` gives the current state, a more detailed `approval_history` table (linking to `case_id` and recording each status change, actor, and timestamp) could be added for comprehensive auditing if needed.

### `prescriptions` Table
Stores prescription details related to a case, as finalized by a doctor.
*   `prescription_id SERIAL PRIMARY KEY`
*   `case_id INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE`
*   `prescribing_doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE SET NULL` (Doctor who issued/approved)
*   `prescription_details JSONB` (Stores medication name, dosage, frequency, duration, instructions as a JSON object, e.g., `{"medication": "Amoxicillin", "dosage": "250mg", "frequency": "TID", "notes": "Take with food"}`)
*   `status VARCHAR(50) DEFAULT 'Draft'` (e.g., 'Draft', 'Pending Doctor Approval', 'Approved', 'Dispensed')
*   `issued_at TIMESTAMP WITH TIME ZONE`
*   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
*   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `appointments` Table
Stores information about scheduled appointments related to a case.
*   `appointment_id SERIAL PRIMARY KEY`
*   `case_id INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE`
*   `doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE SET NULL` (Doctor for the appointment)
*   `patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE`
*   `appointment_time TIMESTAMP WITH TIME ZONE NOT NULL`
*   `status VARCHAR(50) DEFAULT 'Scheduled'` (e.g., 'Scheduled', 'Completed', 'Cancelled by Patient', 'Cancelled by Doctor', 'No Show')
*   `notes TEXT` (Any notes specific to this appointment)
*   `created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
*   `updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

### `audit_logs` Table (Essential for Compliance)
Records significant actions for security and HIPAA compliance.
*   `log_id SERIAL PRIMARY KEY`
*   `user_id INTEGER` (Can reference `patients(patient_id)` or `doctors(doctor_id)`. Consider a general `users` table if admin roles are also directly interacting, or store `user_type`.)
*   `actor_type VARCHAR(50)` (e.g., 'Patient', 'Doctor', 'SystemAgent')
*   `action_type VARCHAR(255) NOT NULL` (e.g., 'VIEWED_CASE', 'APPROVED_PRESCRIPTION', 'UPDATED_PATIENT_INFO', 'LOGIN_SUCCESS', 'LOGIN_FAILURE')
*   `target_entity_type VARCHAR(50)` (e.g., 'Case', 'Patient', 'Prescription')
*   `target_entity_id INTEGER`
*   `details JSONB` (For additional context about the action)
*   `ip_address VARCHAR(45)`
*   `timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

This structure provides a good balance of relational integrity and flexibility, aligning with your visual guide.

## 5. Key Features

*   **Automated Patient Intake:** `Patient Chat Agent` gathers initial patient data.
*   **AI-Powered Decision Support:** `Behind The Scenes Agent` provides research and preliminary insights.
*   **Doctor-in-the-Loop:** `Doctor Chat Agent` and Doctor Dashboard ensure human oversight and final decision-making.
*   **Doctor Dashboard:**
    *   View patient case histories and agent findings.
    *   Review, modify, and approve/reject preliminary diagnoses and prescriptions.
    *   Chat securely with patients (if this feature is integrated into the dashboard).
    *   Manage patient caseload and appointments.
*   **Patient Dashboard:**
    *   View their case history.
    *   Access approved prescriptions and medical summaries.
    *   Track their health information and appointments.
    *   Securely chat with their doctor (if integrated).
*   **Modular and Aesthetic UI:** Using Shadcn/ui for a modern, interactive, and easy-to-navigate experience with visual elements like sliders for dosage.

## 6. Setup and Installation (Placeholder)

Detailed setup instructions for each component (n8n workflows, PostgreSQL database configuration, Next.js application deployment) will be added here. This will include:
*   Cloning the repository.
*   Setting up environment variables (database credentials, API keys, etc.).
*   Instructions for running n8n workflows.
*   SQL scripts or migration tool (e.g., Prisma, TypeORM, Knex.js migrations) instructions to initialize and migrate the database schema.
*   Commands to build and run the Next.js frontend application.

## 7. To-Do / Future Enhancements

*   **Detailed UI/UX Design:** Wireframing and high-fidelity mockups for both dashboards.
*   **Interactive Element Implementation:** Build specific UI components like dosage sliders, data visualizations.
*   **Real-time Chat Integration:** Implement robust, HIPAA-compliant real-time chat within the dashboards.
*   **Comprehensive Testing:**
    *   Unit tests for frontend components and backend logic.
    *   Integration tests for agent-database and dashboard-database interactions.
    *   End-to-end (E2E) tests for user workflows.
*   **Deployment Strategy:** Define and implement a deployment pipeline for n8n, database, and the web application (e.g., using Docker, Kubernetes, Vercel/Netlify).
*   **Advanced Analytics:** Develop reporting features for doctors (e.g., patient trends, common diagnoses).
*   **EMR/EHR Integration:** Explore possibilities for integrating with existing Electronic Medical/Health Record systems (HL7 FHIR).
*   **Mobile Responsiveness & PWA:** Ensure dashboards are fully responsive and consider Progressive Web App capabilities.
*   **HIPAA Compliance:** Conduct a thorough review and implement all necessary technical, physical, and administrative safeguards for full HIPAA compliance. This includes robust audit trails, data backup and recovery plans, and access control policies.
*   **Scalability Testing & Optimization:** Performance testing under load and optimization of database queries and application code.
*   **Refine Agent Logic:** Continuously improve the n8n agents' capabilities, accuracy, and natural language understanding.
*   **Patient Onboarding for Dashboard:** Develop a secure registration and login process for patients.
*   **Data Migration Strategy:** If there's existing data in the "shady database," plan for its migration.
*   **Notification System:** For doctors (new case, pending approval) and patients (appointment reminders, new message).

## 8. Contributing (Placeholder)

Guidelines for contributing to the project, including coding standards, branch management, and pull request processes, will be added here.
