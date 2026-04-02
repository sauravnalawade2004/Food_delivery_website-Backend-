import { AuditLog } from "../models/Auditlogmodel.js";

/**
 * Call this anywhere in controllers to log an admin/system action.
 * session is optional — pass it only inside transactions.
 */
export const logAction = async ({
    performedBy,
    role,
    action,
    entity,
    entityId = null,
    description,
    before = null,
    after = null,
    req = null,
    session = null,
}) => {
    try {
        const logData = {
            performedBy,
            role,
            action,
            entity,
            entityId,
            description,
            before,
            after,
            ipAddress: req ? (req.headers["x-forwarded-for"] || req.ip) : null,
            userAgent: req ? req.headers["user-agent"] : null,
        };

        if (session) {
            await AuditLog.create([logData], { session });
        } else {
            await AuditLog.create(logData);
        }
    } catch (err) {
        // Audit logging should NEVER break the main flow
        console.error("Audit log failed:", err.message);
    }
};