function detectColumnType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonEmpty.length === 0) return "empty";
  const numericCount = nonEmpty.filter((v) => !isNaN(parseFloat(v)) && isFinite(v)).length;
  if (numericCount / nonEmpty.length > 0.9) return "numeric";
  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
  const dateCount = nonEmpty.filter((v) => datePattern.test(String(v))).length;
  if (dateCount / nonEmpty.length > 0.9) return "date";
  return "categorical";
}

function computeNumericStats(values) {
  const nums = values
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / nums.length;
  const variance = nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / nums.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    std_dev: Number(Math.sqrt(variance).toFixed(4)),
    count: nums.length
  };
}

function computeCategoricalStats(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  const freq = {};
  for (const v of nonEmpty) {
    const key = String(v);
    freq[key] = (freq[key] || 0) + 1;
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return {
    unique_count: sorted.length,
    top_values: sorted.slice(0, 5).map(([value, count]) => ({ value, count }))
  };
}

function pearsonCorrelation(xValues, yValues) {
  const pairs = [];
  for (let i = 0; i < xValues.length; i++) {
    const x = xValues[i];
    const y = yValues[i];
    if (x === null || x === undefined || x === "" || y === null || y === undefined || y === "") continue;
    const xn = Number(x);
    const yn = Number(y);
    if (isNaN(xn) || isNaN(yn)) continue;
    pairs.push([xn, yn]);
  }
  if (pairs.length < 3) return null;

  const n = pairs.length;
  const sumX = pairs.reduce((a, p) => a + p[0], 0);
  const sumY = pairs.reduce((a, p) => a + p[1], 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (const [x, y] of pairs) {
    numerator += (x - meanX) * (y - meanY);
    sumSqX += Math.pow(x - meanX, 2);
    sumSqY += Math.pow(y - meanY, 2);
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  if (denominator === 0) return null;

  const r = numerator / denominator;
  return { r: Number(r.toFixed(4)), n };
}

function correlationStrength(r) {
  const abs = Math.abs(r);
  if (abs >= 0.7) return "strong";
  if (abs >= 0.4) return "moderate";
  if (abs >= 0.1) return "weak";
  return "negligible";
}

export function computeCorrelations(rows, columns) {
  const numericCols = columns.filter((c) => c.type === "numeric").map((c) => c.name);
  const correlations = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i];
      const col2 = numericCols[j];
      const xValues = rows.map((r) => r[col1]);
      const yValues = rows.map((r) => r[col2]);
      const result = pearsonCorrelation(xValues, yValues);
      if (result) {
        correlations.push({
          column1: col1,
          column2: col2,
          r: result.r,
          n: result.n,
          strength: correlationStrength(result.r),
          direction: result.r > 0 ? "positive" : "negative"
        });
      }
    }
  }

  return correlations;
}

export function analyzeDataset(rows) {
  if (!rows || rows.length === 0) {
    return { columns: [], summary: {}, row_count: 0 };
  }
  const columnNames = Object.keys(rows[0]);
  const columns = [];
  const summary = {};
  for (const colName of columnNames) {
    const values = rows.map((r) => r[colName]);
    const type = detectColumnType(values);
    const missingCount = values.filter((v) => v === null || v === undefined || v === "").length;
    const colInfo = { name: colName, type, missing_count: missingCount };
    columns.push(colInfo);
    if (type === "numeric") {
      summary[colName] = computeNumericStats(values);
    } else {
      summary[colName] = computeCategoricalStats(values);
    }
  }
  return { columns, summary, row_count: rows.length };
}
