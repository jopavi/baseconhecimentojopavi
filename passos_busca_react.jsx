import { useState, useEffect } from "react";

export default function App() {
  const [pages, setPages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("stepPages_v1");
    if (saved) setPages(JSON.parse(saved));
  }, []);

  // salvar
  const save = (data) => {
    localStorage.setItem("stepPages_v1", JSON.stringify(data));
    setPages(data);
  };

  // extrair palavras-chave simples
  const extractKeywords = (text) => {
    if (!text) return [];
    text = text.toLowerCase().replace(/[^a-zà-ú0-9 ]/gi, " ");
    const stop = new Set(["a","o","e","as","os","de","da","do","para","por","no","na","em","que","como","um","uma"]);
    const parts = text.split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
    const freq = {};
    parts.forEach(w => freq[w] = (freq[w] || 0) + 1);
    return Object.keys(freq).sort((a,b) => freq[b]-freq[a]).slice(0,30);
  };

  // abrir modal
  const openNew = () => {
    setEditing(null);
    setTitle("");
    setSteps("");
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setTitle(p.title);
    setSteps(p.steps.join("\n"));
    setShowModal(true);
  };

  const savePage = () => {
    if (!title.trim()) return alert("Título obrigatório");
    const stepsList = steps.split(/\n/).map(s=>s.trim()).filter(Boolean);
    const keywords = extractKeywords(title + " " + stepsList.join(" "));

    let updated;

    if (editing) {
      updated = pages.map(p => p.id === editing ? { ...p, title, steps: stepsList, keywords } : p);
    } else {
      updated = [...pages, { id: Date.now(), title, steps: stepsList, keywords }];
    }

    save(updated);
    setShowModal(false);
  };

  const removePage = (id) => {
    if (!confirm("Remover página?")) return;
    const updated = pages.filter(p => p.id !== id);
    save(updated);
  };

  // sugestões
  const allKeywords = Array.from(new Set(pages.flatMap(p => p.keywords))).sort();

  const updateSearch = (q) => {
    setSearch(q);
    if (!q) return setSuggestions([]);
    const s = allKeywords.filter(k => k.includes(q.toLowerCase())).slice(0,10);
    setSuggestions(s);
  };

  const filtered = search
    ? pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.keywords.includes(search.toLowerCase()))
    : pages;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">

      <h1 className="text-2xl font-bold">Páginas de Passo-a-Passo (React)</h1>

      {/* Barra de ações */}
      <div className="flex gap-3 items-start">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="border p-2 rounded w-64"
            placeholder="Pesquisar..."
          />

          {suggestions.length > 0 && (
            <div className="absolute bg-white border rounded shadow w-64 mt-1 z-20">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setSearch(s); setSuggestions([]); }}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                >{s}</button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >Adicionar Página</button>

        <button
          onClick={() => save([])}
          className="border border-red-400 text-red-500 px-4 py-2 rounded"
        >Limpar Tudo</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="p-4 bg-white rounded shadow">Nenhuma página encontrada.</div>
        )}

        {filtered.map(p => (
          <div key={p.id} className="p-4 bg-white rounded shadow space-y-2">
            <h3 className="font-semibold text-lg">{p.title}</h3>
            <div className="flex flex-wrap gap-1 text-xs text-blue-700">
              {p.keywords.slice(0,6).map(k => (
                <span key={k} className="px-2 py-1 bg-blue-100 rounded-full">{k}</span>
              ))}
            </div>
            <ol className="list-decimal pl-4 text-sm">
              {p.steps.map((s,i)=>(<li key={i}>{s}</li>))}
            </ol>
            <div className="flex gap-2 pt-2">
              <button onClick={()=>openEdit(p)} className="bg-gray-200 px-2 py-1 rounded">Editar</button>
              <button onClick={()=>removePage(p.id)} className="bg-red-200 text-red-700 px-2 py-1 rounded">Remover</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-30">
          <div className="bg-white rounded p-6 w-full max-w-lg space-y-3">
            <h2 className="text-xl font-bold">{editing ? "Editar Página" : "Nova Página"}</h2>

            <input
              className="border p-2 rounded w-full"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              className="border p-2 rounded w-full h-40"
              placeholder="Passos (um por linha)"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />

            <div className="flex gap-3 justify-end pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded border"
              >Cancelar</button>

              <button
                onClick={savePage}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
