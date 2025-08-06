  const usuarios = {
    "111.111.111-11": { senha: "123", conta: "A" },
    "222.222.222-22": { senha: "456", conta: "B" }
  };

  const ativosB3 = {
    PETR4: 28.50, VALE3: 72.30, ITUB4: 31.10, BBDC4: 27.80,
    ABEV3: 14.25, MGLU3: 3.45, BBAS3: 49.10, LREN3: 18.30
  };

  const contas = {
    A: { nome: "Conta A", saldo: 100000, carteira: { PETR4: 300, VALE3: 200, ITUB4: 100 } },
    B: { nome: "Conta B", saldo: 10, carteira: { MGLU3: 100, BBAS3: 100 } }
  };

  let usuarioAtual = null;
  let extrato = [];
  let ordens = [];
  let cpfAtual = "";

  function login() {
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;
    const user = usuarios[cpf];
    if (user && user.senha === senha) {
      cpfAtual = cpf;
      usuarioAtual = JSON.parse(JSON.stringify(contas[user.conta]));
      usuarioAtual.cpf = cpf;
      extrato = [];
      ordens = [];
      document.getElementById('username').innerText = usuarioAtual.nome;
      document.getElementById('saldo').innerText = usuarioAtual.saldo.toFixed(2);
      document.getElementById('login').classList.add('hidden');
      document.getElementById('portal').classList.remove('hidden');
      atualizarCarteira();
      atualizarBook();
      preencherSelectAtivos();
      atualizarExtrato();
      atualizarOrdens();
      document.getElementById('senhaMsg').innerText = "";
    } else {
      document.getElementById('loginMsg').innerText = "CPF ou senha inválidos.";
    }
  }

  function logout() {
    usuarioAtual = null;
    extrato = [];
    ordens = [];
    cpfAtual = "";
    document.getElementById('portal').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('cpf').value = "";
    document.getElementById('senha').value = "";
  }

  function toggleSenha(idCampo, elemento) {
    const campo = document.getElementById(idCampo);
    if (campo.type === "password") {
      campo.type = "text";
      elemento.innerText = "🙈";
    } else {
      campo.type = "password";
      elemento.innerText = "👁️";
    }
  }

  function alterarSenha() {
    const novaSenha = document.getElementById("novaSenha").value;
    if (!novaSenha || novaSenha.length < 3) {
      document.getElementById("senhaMsg").innerText = "Senha inválida. Mínimo 3 caracteres.";
      document.getElementById("senhaMsg").className = "error";
      return;
    }
    usuarios[cpfAtual].senha = novaSenha;
    document.getElementById("senhaMsg").innerText = "Senha alterada com sucesso!";
    document.getElementById("senhaMsg").className = "success";
    document.getElementById("novaSenha").value = "";
  }

  function atualizarCarteira() {
    const tbody = document.querySelector("#carteira tbody");
    tbody.innerHTML = "";
    for (let ativo in usuarioAtual.carteira) {
      tbody.innerHTML += `<tr><td>${ativo}</td><td>${usuarioAtual.carteira[ativo]}</td></tr>`;
    }
    document.getElementById("saldo").innerText = usuarioAtual.saldo.toFixed(2);
  }

  function atualizarBook() {
    const tbody = document.querySelector("#book tbody");
    tbody.innerHTML = "";
    for (let ativo in ativosB3) {
      tbody.innerHTML += `<tr><td>${ativo}</td><td>${ativosB3[ativo].toFixed(2)}</td></tr>`;
    }
  }

  function preencherSelectAtivos() {
    const select = document.getElementById("ativo");
    select.innerHTML = "";
    for (let ativo in ativosB3) {
      select.innerHTML += `<option value="${ativo}">${ativo}</option>`;
    }
  }

  function executarOperacao() {
    const tipo = document.getElementById('tipo').value;
    const ativo = document.getElementById('ativo').value;
    const qtd = parseInt(document.getElementById('quantidade').value);
    const valor = parseFloat(document.getElementById('valor').value);
    const cotacao = ativosB3[ativo];
    const total = qtd * valor;

    if (isNaN(qtd) || qtd <= 0 || qtd % 100 !== 0 || isNaN(valor)) {
      document.getElementById("mensagem").innerText = "Preencha quantidade válida (múltiplos de 100) e valor.";
      return;
    }

    if (tipo === "Compra" && total > usuarioAtual.saldo) {
      document.getElementById("mensagem").innerText = "Saldo insuficiente para essa compra.";
      return;
    }

    if (tipo === "Venda" && (!usuarioAtual.carteira[ativo] || usuarioAtual.carteira[ativo] < qtd)) {
      document.getElementById("mensagem").innerText = "Você não possui ativos suficientes para vender.";
      return;
    }

    if (Math.abs(valor - cotacao) > 5) {
      ordens.unshift({ tipo, ativo, qtd, valor, total, cotacao, status: "Rejeitada", id: Date.now() });
      atualizarOrdens();
      document.getElementById("mensagem").innerText = "Ordem rejeitada (diferença > R$5).";
      return;
    }

    const ordem = {
      tipo,
      ativo,
      qtd,
      valor,
      total,
      cotacao,
      status: valor === cotacao ? "Executada" : "Aceita",
      id: Date.now()
    };

    if (ordem.status === "Executada") {
      aplicarOrdem(ordem);
      extrato.unshift(ordem);
    }

    ordens.unshift(ordem);
    atualizarOrdens();
    atualizarCarteira();
    atualizarExtrato();
    document.getElementById("mensagem").innerText = "Ordem enviada.";
  }

  function aplicarOrdem(o) {
    if (o.tipo === "Compra") {
      usuarioAtual.saldo -= o.total;
      usuarioAtual.carteira[o.ativo] = (usuarioAtual.carteira[o.ativo] || 0) + o.qtd;
    } else {
      usuarioAtual.saldo += o.total;
      usuarioAtual.carteira[o.ativo] -= o.qtd;
    }
  }

  function cancelarOrdem(id) {
    const index = ordens.findIndex(o => o.id === id && o.status === "Aceita");
    if (index !== -1) {
      ordens.splice(index, 1);
      atualizarOrdens();
      document.getElementById("mensagem").innerText = "Ordem cancelada.";
    }
  }

  function atualizarOrdens() {
    const tbody = document.querySelector("#ordens tbody");
    tbody.innerHTML = "";
    ordens.forEach(o => {
      tbody.innerHTML += `
        <tr>
          <td>${o.tipo}</td>
          <td>${o.ativo}</td>
          <td>${o.qtd}</td>
          <td>${o.valor.toFixed(2)}</td>
          <td>${o.cotacao.toFixed(2)}</td>
          <td>${o.status}</td>
          <td>${
            o.status === "Aceita"
              ? `<button class="btn-cancelar" onclick="cancelarOrdem(${o.id})">Cancelar</button>`
              : ""
          }</td>
        </tr>`;
    });
  }

  function atualizarExtrato() {
    const tbody = document.querySelector("#extrato tbody");
    tbody.innerHTML = "";
    extrato.forEach(e => {
      tbody.innerHTML += `<tr><td>${e.tipo}</td><td>${e.ativo}</td><td>${e.qtd}</td><td>${e.total.toFixed(2)}</td></tr>`;
    });
  }

  // Atualização automática de cotações e ordens
  setInterval(() => {
    for (let ativo in ativosB3) {
      ativosB3[ativo] += 0.01;
      ativosB3[ativo] = parseFloat(ativosB3[ativo].toFixed(2));
    }

    ordens.forEach(o => {
      if (o.status === "Aceita" && o.valor === ativosB3[o.ativo]) {
        aplicarOrdem(o);
        o.status = "Executada";
        extrato.unshift(o);
      }
    });

    if (usuarioAtual) {
      atualizarBook();
      atualizarOrdens();
      atualizarCarteira();
      atualizarExtrato();
    }
  }, 10000);
