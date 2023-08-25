<?php
        include("config.php");
?>
<div class="app-view">
    <div class="app-container">

    <form action="?page=salvar-col" method="POST" class="form-col">

        <input type="hidden" name="acao" value="cadastrar" />
        <input type="hidden" name="owner_id" value="<?php echo $_SESSION['id']; ?>" />

        <div class="row-categ-cad">
            <h3 class=" "><svg xmlns="http://www.w3.org/2000/svg" style="margin: 4px 0 -4px 0;" width="19" height="21" viewBox="0 0 19 21" fill="none">
            <path d="M13.5135 9.95946C13.5135 9.51168 13.1505 9.14865 12.7027 9.14865C12.2549 9.14865 11.8919 9.51168 11.8919 9.95946H13.5135ZM7.02703 9.95946C7.02703 9.51168 6.66401 9.14865 6.21622 9.14865C5.76842 9.14865 5.40541 9.51168 5.40541 9.95946H7.02703ZM18.1081 5.63514H18.9189C18.9189 5.50927 18.8896 5.38511 18.8333 5.27253L18.1081 5.63514ZM15.9459 1.31081L16.6711 0.948205C16.5338 0.673514 16.2531 0.5 15.9459 0.5V1.31081ZM2.97297 1.31081V0.5C2.66586 0.5 2.3851 0.673514 2.24776 0.948205L2.97297 1.31081ZM0.810811 5.63514L0.0855999 5.27253C0.0293083 5.38511 0 5.50927 0 5.63514H0.810811ZM9.45946 4.82432C9.01168 4.82432 8.64865 5.18734 8.64865 5.63514C8.64865 6.08293 9.01168 6.44595 9.45946 6.44595V4.82432ZM17.2973 12.1216C17.2973 12.5694 17.6603 12.9324 18.1081 12.9324C18.5559 12.9324 18.9189 12.5694 18.9189 12.1216H17.2973ZM18.9189 17.527C18.9189 17.0792 18.5559 16.7162 18.1081 16.7162C17.6603 16.7162 17.2973 17.0792 17.2973 17.527H18.9189ZM4.05405 6.44595C4.50185 6.44595 4.86487 6.08293 4.86487 5.63514C4.86487 5.18734 4.50185 4.82432 4.05405 4.82432V6.44595ZM11.8919 9.95946C11.8919 11.3028 10.8028 12.3919 9.45946 12.3919V14.0135C11.6985 14.0135 13.5135 12.1985 13.5135 9.95946H11.8919ZM9.45946 12.3919C8.11611 12.3919 7.02703 11.3028 7.02703 9.95946H5.40541C5.40541 12.1985 7.22047 14.0135 9.45946 14.0135V12.3919ZM18.8333 5.27253L16.6711 0.948205L15.2208 1.67342L17.3829 5.99774L18.8333 5.27253ZM15.9459 0.5H2.97297V2.12162H15.9459V0.5ZM2.24776 0.948205L0.0855999 5.27253L1.53602 5.99774L3.69818 1.67342L2.24776 0.948205ZM9.45946 6.44595H18.1081V4.82432H9.45946V6.44595ZM17.2973 5.63514V12.1216H18.9189V5.63514H17.2973ZM15.9459 18.8784H2.97297V20.5H15.9459V18.8784ZM1.62162 17.527V5.63514H0V17.527H1.62162ZM2.97297 18.8784C2.22664 18.8784 1.62162 18.2734 1.62162 17.527H0C0 19.169 1.33105 20.5 2.97297 20.5V18.8784ZM17.2973 17.527C17.2973 18.2734 16.6923 18.8784 15.9459 18.8784V20.5C17.5879 20.5 18.9189 19.169 18.9189 17.527H17.2973ZM0.810811 6.44595H4.05405V4.82432H0.810811V6.44595Z" fill="#4739A3"/>
            </svg> Categoria</h3>
            <div id="categ-flag"><p>selecione uma categoria</p></div>
        </div>
        <div class="steps" id="steps">


        <div class="step">

            <h2 class="normal">O que vamos colecionar?</h2>
            <br />

            <div class="categ-form">
            <?php
            $sql = "SELECT * FROM categorias";
            $result = $mysqli->query($sql);
            if ($result->num_rows > 0) {
              while ($row = $result->fetch_assoc()) {
                echo '<input class="boxed-check-input" type="radio" name="categoria" value="' . $row['cat_id'] . '" id="' . $row['cat_id'] . '" />';
                echo '<label class="input" for="'. $row['cat_id'] . '">' . $row['emoji_cat'] . " " . $row['name_cat'] . '</label>';
                echo '<br>';
              }
            } else {
              echo "Nenhuma categoria encontrada.";
            }
            ?>

<p>
                Nenhuma das opções são compatíveis com sua coleção? Crie uma nova categoria.
            </p>
            <a class="label" href="">Criar nova categoria</a>
            </div>




        </div>

        <div class="step">
            <h2 class="normal">Dê um nome para sua coleção:</h2>
            <br />
            <input type="text" placeholder="Minha coleção de minis" name="col_name" id="nome_col"/>
        </div>

        <div class="step">
                <h2 class="normal" id="valorCampo">Selecione uma cor para a sua coleção</h2>
                <input type="color" name="col_color" />
                <p>Essa cor servirá para te ajudar a organizar sua coleção.</p>
        </div>


        <div class="step">
        <h2 class="normal" id="valorCampoB">Crie uma descrição para a sua coleção</h2>
        <input type="text" name="col_desc" />
        <input type="submit" value="Enviar" />
        </div>
    </form>

    </div>

    <div class="go-back">
    <a class="fake-button" id="botaoVoltar" style="opacity:0;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M20 12L4 12L10 18M7 9L10 6" stroke="#001A72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    Voltar</a>
    <a class="fake-button" id="botaoAvancar">
        
    
    Avançar <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M4 12L20 12L14.0001 18M17 9L14 6" stroke="#001A72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</a>
    </div>

    </div>
</div>
<script>
    // Obtém o elemento do campo de entrada e o elemento de parágrafo onde exibiremos o valor
const campoInput = document.getElementById('nome_col');
const valorCampoParagrafo = document.getElementById('valorCampo');
const valorCampoParagrafoB = document.getElementById('valorCampoB');

// Adiciona um ouvinte de evento ao campo de entrada
campoInput.addEventListener('input', function() {
  const valor = campoInput.value; // Obtém o valor do campo de entrada
  valorCampoParagrafo.textContent = `Selecione uma cor para ${valor}`; // Atualiza o elemento de parágrafo
});
campoInput.addEventListener('input', function() {
  const valor = campoInput.value; // Obtém o valor do campo de entrada
  valorCampoParagrafoB.textContent = `Crie uma descrição para ${valor}`; // Atualiza o elemento de parágrafo
});
</script>

<script>
// Obtém a div com a classe "steps"
const stepsDiv = document.getElementById('steps');
// Obtém o botão de voltar
const botaoVoltar = document.getElementById('botaoVoltar');
const botaoAvancar = document.getElementById('botaoAvancar');

// Função para avançar o scroll da div
function avancarScroll() {
  stepsDiv.scrollLeft += stepsDiv.clientWidth; // Avança o scroll em 100% da largura visível

}

// Função para retroceder o scroll da div
function retrocederScroll() {
  stepsDiv.scrollLeft -= stepsDiv.clientWidth; // Retrocede o scroll em 100% da largura visível
}

// função que dá um breve fadein e fadout




// Função para verificar e ajustar a visibilidade do botão de voltar
function verificarVisibilidadeBotao() {
  if (stepsDiv.scrollLeft > 100) {
    botaoVoltar.style.opacity = '1';
  } else {
    botaoVoltar.style.opacity = '0';
  }
}

function verificarVisiAvan(){
    if (stepsDiv.scrollLeft > 1000) {
        botaoAvancar.style.opacity = '0';
    } else {
    botaoAvancar.style.opacity = '1';
  }
}


// Adiciona evento de scroll à div steps
stepsDiv.addEventListener('scroll', verificarVisibilidadeBotao);
stepsDiv.addEventListener('scroll', verificarVisiAvan);

// Exemplo de evento que chama a função de avançar o scroll
document.getElementById('botaoAvancar').addEventListener('click', function() {
  avancarScroll();
});

// Exemplo de evento que chama a função de retroceder o scroll
document.getElementById('botaoVoltar').addEventListener('click', function() {
  retrocederScroll();
});

</script>
<script>
// Obtém todos os elementos dos inputs de radio
const inputsRadio = document.querySelectorAll('.boxed-check-input');

// Obtém o elemento onde você deseja mostrar os dados selecionados
const categFlag = document.getElementById('categ-flag');

// Adiciona um ouvinte de evento para cada input de radio
inputsRadio.forEach(input => {
  input.addEventListener('change', function() {
    // Encontra o label correspondente ao input selecionado
    const labelSelecionado = document.querySelector(`label[for="${input.id}"]`);

    // Obtém o valor e o texto do label selecionado
    const textoSelecionado = labelSelecionado.textContent;

    // Atualiza o conteúdo da div categ-flag com os dados selecionados
    categFlag.innerHTML = `<p>${textoSelecionado}</p>`;
  });
});

</script>