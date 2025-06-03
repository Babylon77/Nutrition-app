# Security & Compliance Plan

This document outlines key security and compliance considerations for the Fuel IQ application, based on initial reviews and best practices.

## Security Checklist & Recommendations

| Item                 | Current Status (Assumed/Stated) | Recommendation                                                               | Priority | Target Sprint | Notes                                                                 |
|----------------------|---------------------------------|------------------------------------------------------------------------------|----------|---------------|-----------------------------------------------------------------------|
| **Password Storage** | Not explicitly stated           | Implement Argon2id for password hashing with a salt of at least 13 bytes.    | Critical | Sprint X      | Review current implementation and upgrade if necessary.               |
| **PII at Rest**      | MongoDB unencrypted (local)     | Enable MongoDB TLS + at-rest encryption for self-hosted. Consider MongoDB Atlas (which provides this by default) for production if not already fully utilized. | Critical | Sprint X      | Ensure all PII (Personally Identifiable Information) is encrypted.    |
| **API Security**     | JWT Auth in place               | Continue regular review of JWT implementation, token expiry, and refresh mechanisms. Implement robust input validation (e.g., zod/joi) on all API endpoints. | High     | Ongoing       | Part of controller refactor.                                          |
| **Rate Limiting**    | Basic / Needs Enhancement       | Implement `express-rate-limit` on sensitive/public endpoints, especially those calling external APIs (OpenAI, Gemini). Implement caching for identical AI prompts and intelligent back-off strategies on 429 errors. | High     | Sprint X      | Mitigates abuse and reduces costs.                                   |
| **Dependency Security**| Not explicitly stated           | Regularly scan dependencies for known vulnerabilities (e.g., `npm audit`, Snyk). | Medium   | Ongoing       | Keep dependencies up to date.                                         |

## Compliance Checklist & Recommendations (HIPAA/GDPR Focus)

| Item                     | Current Status (Assumed/Stated) | Recommendation                                                                                                                               | Priority | Target Sprint | Notes                                                                                                    |
|--------------------------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|----------|---------------|----------------------------------------------------------------------------------------------------------|
| **Data Classification**  | Bloodwork data = PHI/PII        | Clearly classify all data types (e.g., food logs, journal entries, bloodwork, user profile) to understand varying security/privacy needs. | High     | Sprint X      | Foundation for other compliance steps.                                                                  |
| **User Consent**         | Basic for ToS/Privacy Policy?   | Implement granular consent flows, especially for processing sensitive data like bloodwork (PHI) and journal entries if AI analyzed. Clearly explain data usage. | Critical | Sprint X      | Essential for GDPR and HIPAA.                                                                           |
| **Data Deletion**        | Not explicitly stated           | Implement a robust "right to be forgotten" endpoint and process, ensuring complete deletion of user data upon request.                        | Critical | Sprint X      | Essential for GDPR.                                                                                     |
| **Data Access Controls** | Basic user roles                | Refine access controls. Ensure only necessary personnel/systems can access sensitive data. Implement audit logs for sensitive data access.     | High     | Sprint X      |                                                                                                          |
| **Data Minimization**    | Not explicitly stated           | Collect and retain only the data absolutely necessary for providing the service.                                                               | Medium   | Ongoing       |                                                                                                          |
| **Breach Notification**  | Not explicitly stated           | Establish a data breach notification plan and procedure.                                                                                     | Medium   | Sprint Y      | Important for compliance.                                                                               |

*Note: "Sprint X" / "Sprint Y" are placeholders and should be assigned to specific sprints during detailed planning.*

This document will be reviewed and updated regularly as the application evolves. 