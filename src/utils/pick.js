export const pick = (obj, allowedKeys) => {
    const out = {};
    for (const k of allowedKeys) {
      if (obj[k] !== undefined) out[k] = obj[k];
    }
    return out;
  };
  