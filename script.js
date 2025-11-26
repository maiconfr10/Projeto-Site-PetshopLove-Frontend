const API = "http://localhost:8080";
let token = null;

// MODELOS PARA GERAR CAMPOS
const modelos = {
  cliente: ["nomeCliente", "emailCliente", "teleCliente"],

  animal: ["nomeAnimal", "especie", "raca", "idade", "idCliente"],

  atendimento: ["data", "observacoes", "idAnimal"],

  servico: ["descricao", "preco"],

  "atendimento-servico": ["idAtendimento", "idServico"]
};

// LOGIN
function login() {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        token = data.token;
        document.getElementById("login-section").classList.add("hidden");
        document.getElementById("crud-section").classList.remove("hidden");
      } else {
        document.getElementById("login-msg").innerText = "Credenciais inválidas";
      }
    });
}

function logout() {
  token = null;
  document.getElementById("crud-section").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
}

function entidadeURL() {
  const entidade = document.getElementById("select-entidade").value;
  switch (entidade) {
    case "cliente": return "/cliente";
    case "animal": return "/animal";
    case "atendimento": return "/atendimento";
    case "servico": return "/servico";
    case "atendimento-servico": return "/atendimento-servico";
  }
}

// ----------------------
// FORMULÁRIO DINÂMICO
// ----------------------
function carregarCampos() {
  const entidade = document.getElementById("select-entidade").value;
  const container = document.getElementById("form-dinamico");

  container.innerHTML = "";

  modelos[entidade].forEach(campo => {
    container.innerHTML += `
      <input 
        id="campo-${campo}"
        placeholder="${campo}"
        style="display:block;margin:6px 0;padding:8px"
      />
    `;
  });

  document.getElementById("lista").innerText = "";
}

function get(campo) {
  return document.getElementById("campo-" + campo).value;
}

// ---------------------------
// MONTAGEM DE JSON CORRETO
// ---------------------------
function montarObjeto(entidade) {
  let obj = {};

  if (entidade === "animal") {
    obj = {
      nomeAnimal: get("nomeAnimal"),
      especie: get("especie"),
      raca: get("raca"),
      idade: get("idade"),
      idCliente: Number(get("idCliente"))
    };
  }

  else if (entidade === "cliente") {
    obj = {
      nomeCliente: get("nomeCliente"),
      emailCliente: get("emailCliente"),
      teleCliente: get("teleCliente")
    };
  }

  else if (entidade === "servico") {
    obj = {
      descricao: get("descricao"),
      preco: Number(get("preco"))
    };
  }

  else if (entidade === "atendimento") {
    obj = {
      data: get("data"),
      observacoes: get("observacoes"),
      animalId: Number(get("idAnimal"))
    };
  }

  else if (entidade === "atendimento-servico") {
    obj = {
      atendimento: { idAtendimento: Number(get("idAtendimento")) },
      servico: { idServico: Number(get("idServico")) }
    };
  }

  return obj;
}

// -------------------------
// CRIAR REGISTRO
// -------------------------
function criarRegistro() {
  const entidade = document.getElementById("select-entidade").value;

  const obj = montarObjeto(entidade);

  fetch(API + entidadeURL(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(obj),
  })
    .then(res => res.json())
    .then(() => {
      alert("Criado com sucesso!");
      listarRegistros();
    });
}

// -------------------------
function listarRegistros() {
  fetch(API + entidadeURL(), {
    headers: { "Authorization": `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("lista").innerText = JSON.stringify(data, null, 2);
    });
}

// -------------------------
function buscarPorId() {
  const id = document.getElementById("id-input").value;
  if (!id) return alert("Digite um ID!");

  fetch(API + entidadeURL() + "/" + id, {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      preencherCampos(data);
      alert("Dados carregados nos campos!");
    })
    .catch(() => alert("Erro ao buscar ID"));
}

// 🔥🔥🔥 CORREÇÃO AQUI 🔥🔥🔥
// --- Função corrigida para preencher idAnimal corretamente ---
function preencherCampos(data) {
  Object.keys(data).forEach(key => {
    const campo = document.getElementById("campo-" + key);
    if (campo) campo.value = data[key];
  });

  // Preencher idAnimal quando vier aninhado
  if (data.animal && data.animal.idAnimal !== undefined) {
    const campoAnimal = document.getElementById("campo-idAnimal");
    if (campoAnimal) campoAnimal.value = data.animal.idAnimal;
  }

  // Preencher idCliente quando vier aninhado
  if (data.cliente && data.cliente.idCliente !== undefined) {
    const campoCliente = document.getElementById("campo-idCliente");
    if (campoCliente) campoCliente.value = data.cliente.idCliente;
  }
}

// -------------------------
function atualizarRegistro() {
  const id = document.getElementById("id-input").value;
  if (!id) return alert("Digite um ID!");

  const entidade = document.getElementById("select-entidade").value;
  const obj = montarObjeto(entidade);

  fetch(API + entidadeURL() + "/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(obj),
  })
    .then(res => res.json())
    .then(() => {
      alert("Atualizado com sucesso!");
      listarRegistros();
    });
}

// -------------------------
function deletarRegistro() {
  const id = document.getElementById("id-input").value;
  if (!id) return alert("Digite um ID!");

  fetch(API + entidadeURL() + "/" + id, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(() => {
      alert("Deletado com sucesso!");
      listarRegistros();
    });
}
function associarServico() {
  const idAtendimento = Number(get("idAtendimento"));
  const idServico = Number(get("idServico"));

  if (!idAtendimento || !idServico) {
    return alert("Preencha idAtendimento e idServico");
  }

  fetch(`${API}/atendimento-servico/${idAtendimento}/${idServico}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      if (res.ok) {
        alert("Serviço associado ao atendimento com sucesso!");
      } else {
        alert("Erro ao associar serviço");
      }
    });
}
function calcularTotal() {
  fetch(`${API}/servico/com-total`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      alert("Valor total de serviços: R$ " + data.total);
    })
    .catch(() => alert("Erro ao calcular total"));
}


