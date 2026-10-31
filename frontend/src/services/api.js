/**
 * DB-Surgeon API Client
 * Centralized service layer for all backend communications.
 * Respects VITE_API_BASE_URL and supports offline mock mode via VITE_USE_MOCKS.
 */

import messyDataMock from '../mocks/messyData.json';
import normalizedDataMock from '../mocks/normalizedData.json';
import executionLogsMock from '../mocks/executionLogs.json';
import providerStatusMock from '../mocks/providerStatus.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
let useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';

// Runtime mock toggle (useful for live demo toggling)
export const isMockMode = () => useMocks;
export const setMockMode = (enabled) => {
  useMocks = Boolean(enabled);
};

// Simulated network latency helper for realistic mock feeling
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 1. Health & AI Provider Status
 * Endpoint: GET /api/status (or /api/v1/status)
 */
export async function getProviderStatus(forcedEdge = false) {
  if (useMocks) {
    await delay(200);
    if (forcedEdge) {
      return providerStatusMock.edge;
    }
    return providerStatusMock.cloud;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`Status check failed with ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[DB-Surgeon API] Status check failed, checking fallback:', err);
    return {
      active_provider: 'none',
      online: false,
      error: err.message,
    };
  }
}

/**
 * 2. Upload SQLite Database (.db file)
 * Endpoint: POST /api/upload-db
 */
export async function uploadDatabase(file) {
  if (useMocks) {
    await delay(600);
    return {
      status: 'success',
      filename: file ? file.name : 'messy_orders.db',
      sizeBytes: file ? file.size : 45056,
      tableCount: 1,
      detectedTable: messyDataMock.tableName,
      rowCount: messyDataMock.rowCount,
      issuesDetected: messyDataMock.issuesDetected,
      preview: messyDataMock.sampleRows,
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload-db`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`DB upload failed: ${res.statusText}`);
  return await res.json();
}

/**
 * 3. Upload Whiteboard ER Diagram
 * Endpoint: POST /api/upload-whiteboard
 */
export async function uploadWhiteboardImage(base64Image) {
  if (useMocks) {
    await delay(900);
    return {
      status: 'success',
      source: 'Multimodal Gemma 4 Vision',
      extractedEntities: ['customers', 'addresses', 'orders', 'order_items'],
      detectedRelations: normalizedDataMock.relations,
      schema: normalizedDataMock,
    };
  }

  const payload = {
    image_b64: base64Image,
    image_base64: base64Image, // support both naming conventions
  };

  const res = await fetch(`${API_BASE_URL}/api/upload-whiteboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Whiteboard upload failed: ${res.statusText}`);
  return await res.json();
}

/**
 * 4. Dry-Run Schema Analysis
 * Endpoint: POST /api/analyze
 * Generates proposed schema + SQL without modifying the database.
 */
export async function analyzeSchema(commandText, dbContext = 'messy_orders.db') {
  if (useMocks) {
    await delay(750);
    return {
      status: 'success',
      command: commandText,
      schema: normalizedDataMock,
      proposedSql: normalizedDataMock.proposedSql,
      dryRun: true,
      timestamp: new Date().toISOString(),
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: commandText,
      database: dbContext,
      dry_run: true,
    }),
  });

  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
  return await res.json();
}

/**
 * 5. Execute Approved Mutation with Self-Healing Loop
 * Endpoint: POST /api/execute
 */
export async function executeMutation(sqlPayload) {
  if (useMocks) {
    await delay(1100);
    return {
      status: 'success',
      executionId: executionLogsMock.executionId,
      logs: executionLogsMock.attempts,
      validation: executionLogsMock.validation,
      totalDurationMs: executionLogsMock.totalDurationMs,
      rowsAffected: executionLogsMock.rowsAffected,
      tablesCreated: executionLogsMock.tablesCreated,
      resultSchema: normalizedDataMock,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sql: typeof sqlPayload === 'string' ? sqlPayload : sqlPayload.sql,
    }),
  });

  if (!res.ok) throw new Error(`Execution failed: ${res.statusText}`);
  return await res.json();
}

/**
 * 6. Time-Travel Rollback
 * Endpoint: POST /api/rollback
 */
export async function rollbackDatabase() {
  if (useMocks) {
    await delay(450);
    return {
      status: 'success',
      message: 'Physical state hot-swapped: backup.db restored successfully.',
      currentDatabase: 'messy_orders.db',
      timestamp: new Date().toISOString(),
      revertedSchema: messyDataMock,
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error(`Rollback failed: ${res.statusText}`);
  return await res.json();
}

/**
 * 7. Plain English Database Command
 * Endpoint: POST /api/command
 */
export async function executeCommand(message) {
  if (useMocks) {
    await delay(600);
    // Check if synthesizing data
    if (/generate|dummy|synthesize/i.test(message)) {
      return {
        status: 'success',
        type: 'synthesis',
        provider: 'ollama', // Demonstrates Edge fallback
        message: 'Synthesized 50 localized Goan customer rows.',
        rowsInserted: 50,
      };
    }
    // Default to normalization dry-run
    return await analyzeSchema(message);
  }

  const res = await fetch(`${API_BASE_URL}/api/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error(`Command execution failed: ${res.statusText}`);
  return await res.json();
}

/**
 * Helper: Fetch initial messy table data for the demo hook
 */
export function getInitialMessyData() {
  return messyDataMock;
}
