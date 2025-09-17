interface AuditLogEntry {
  actor_id: string;
  agency_id: string;
  entity: string;
  action: string;
  entity_id?: string;
  diff?: Record<string, unknown>;
}

const redactSensitiveFields = (data: Record<string, unknown>): Record<string, unknown> => {
  const redacted = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'phone'];

  Object.keys(redacted).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      if (typeof redacted[key] === 'string') {
        const str = redacted[key] as string;
        redacted[key] = str.length > 3 ? `${str.substring(0, 3)}***` : '***';
      } else {
        redacted[key] = '[REDACTED]';
      }
    }
  });

  return redacted;
};

export async function auditLog(
  supabaseClient: any,
  entry: AuditLogEntry
): Promise<void> {
  try {
    // Redact sensitive information from diff
    const sanitizedDiff = entry.diff ? redactSensitiveFields(entry.diff) : null;

    const auditEntry = {
      actor_id: entry.actor_id,
      agency_id: entry.agency_id,
      entity: entry.entity,
      action: entry.action,
      entity_id: entry.entity_id || null,
      diff: sanitizedDiff,
      created_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('audit_log')
      .insert(auditEntry);

    if (error) {
      console.error('[AUDIT] Failed to log audit entry:', error.message);
      // Don't throw error to avoid breaking the main operation
    } else {
      console.log(`[AUDIT] Logged ${entry.entity}:${entry.action} by ${entry.actor_id}`);
    }
  } catch (error) {
    console.error('[AUDIT] Exception in audit logging:', error);
    // Don't throw error to avoid breaking the main operation
  }
}