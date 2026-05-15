import Mux from "@mux/mux-node";

// Lazy singleton — não instancia no build, só em runtime
let _mux: Mux | null = null;

function getMux(): Mux {
  if (_mux) return _mux;
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error("MUX_TOKEN_ID e MUX_TOKEN_SECRET são obrigatórios");
  }
  _mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });
  return _mux;
}

export { getMux as mux };
