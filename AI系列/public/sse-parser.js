function parseSseChunk(chunk) {
  return chunk
    .split('\n\n')
    .filter((block) => block.trim())
    .map((block) => {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const event = eventLine ? eventLine.slice(6).trim() : 'message';
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => {
          const raw = line.slice(5);
          return raw.startsWith(' ') ? raw.slice(1) : raw;
        })
        .join('\n');

      return { event, data };
    });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseSseChunk,
  };
}

if (typeof window !== 'undefined') {
  window.parseSseChunk = parseSseChunk;
}
