import { useCallback, useEffect, useState } from "react";
import { get } from "./api";

/**
 * Busca um recurso no BFF com estados explícitos de carregamento e erro.
 * `loading` é derivado: verdadeiro enquanto a resposta da chave atual não chega.
 */
export function useResource(path) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const key = `${path}#${version}`;

  useEffect(() => {
    let ativo = true;
    get(path)
      .then((data) => ativo && setState({ key, data, error: null }))
      .catch((err) => ativo && setState((s) => ({ key, data: s.data, error: err.message })));
    return () => {
      ativo = false;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: state.data, loading: state.key !== key, error: state.key === key ? state.error : null, reload };
}

/** Identificador do cliente da demonstração (sem login nesta entrega). */
export function clienteId() {
  let id = localStorage.getItem("prato.clienteId");
  if (!id) {
    id = `cliente-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("prato.clienteId", id);
  }
  return id;
}
