(async() => {
    const program = "src/blackjack.pl";
    
    // Creamos la sesión de Prolog y cargamos la base de conocimientos
    const session = pl.create();
    await session.promiseConsult(program);

    // Obtenemos las cartas iniciales
    let [playerCards, dealerCards, restDeck] = await getInitialCards(session);
    console.log(playerCards, dealerCards);

    // Get canvas
    canvas = document.getElementById("game")
    ctx = canvas.getContext("2d")

    // Load card spritesheet
    cardImage = new Image()
    cardImage.src = "images/playingCards.png"
    cardImage.onload = function() {
        drawCards(cardsFromList(playerCards), cardsFromList(dealerCards), true)
    }

    // Get buttons
    const hitButton = document.getElementById("hit")
    const standButton = document.getElementById("stand")

    // Add event listeners
    hitButton.addEventListener("click", async function() {
        [playerCards, restDeck] = await playerDrawCard(session, restDeck, playerCards);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCards(cardsFromList(playerCards), cardsFromList(dealerCards), true)

        // Check if player has busted
        const player_busted = await playerHasBusted(session, playerCards);
        if(player_busted) {
            ctx.fillText("¡Te has estallado!", 15, 400)
            hitButton.disabled = true;
            standButton.disabled = true;
        }
    })

    standButton.addEventListener("click", async function() {
        dealerCards = await dealerTurn(session, restDeck, dealerCards);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCards(cardsFromList(playerCards), cardsFromList(dealerCards), false)

        const winner = await determineWinner(session, playerCards, dealerCards);
        if(winner.id === "player")
            ctx.fillText("¡Has ganado!", 15, 400)
        else if(winner.id === "dealer")
            ctx.fillText("¡Has perdido!", 15, 400)
        else
            ctx.fillText("¡Has empatado!", 15, 400)
        
        hitButton.disabled = true;
        standButton.disabled = true;
    })
})();

// Determina si el jugador se ha pasado o no
async function playerHasBusted(session, hand) {
    const goal = "has_player_busted(" + hand.toString() + ").";
    await session.promiseQuery(goal);
    const answer = await session.promiseAnswer();
    return answer;
}

// El jugador pide una carta
async function playerDrawCard(session, deck, playerHand) {
    const goal = "draw_card_into_hand(" + deck.toString() + ", NewDeck," + playerHand.toString() + ", NewHand).";
    await session.promiseQuery(goal);
    const answer = await session.promiseAnswer();
    const newHand = answer.lookup("NewHand");
    const rest = answer.lookup("NewDeck");
    return [newHand, rest];
}

// Hace que el crupier juegue su turno
async function dealerTurn(session, deck, dealerHand) {
    const goal = "dealer_turn(" + deck.toString() + ", " + dealerHand.toString() + ", NewDealerHand).";
    await session.promiseQuery(goal);
    const answer = await session.promiseAnswer();
    const newHand = answer.lookup("NewDealerHand");
    return newHand;
}

// Determina el ganador de la partida
async function determineWinner(session, playerHand, dealerHand) {
    const goal = "determine_winner(" + playerHand.toString() + ", " + dealerHand.toString() + ", Winner).";
    await session.promiseQuery(goal);
    const answer = await session.promiseAnswer();
    const winner = answer.lookup("Winner");
    return winner;
}

// Obtiene las cartas iniciales del jugador y del crupier, así como el mazo restante
async function getInitialCards(session) {
    const goal = "initial_setup(PlayerCards, DealerCards, RestDeck).";
    await session.promiseQuery(goal);
    const answer = await session.promiseAnswer();
    const playerCards = answer.lookup("PlayerCards");
    const dealerCards = answer.lookup("DealerCards");
    const restDeck = answer.lookup("RestDeck");
    return [playerCards, dealerCards, restDeck];
}

// Convierte una carta de Prolog a un objeto de carta
function convertCard(card) {
    return {
        suit: card.args[0].toString(),
        value: card.args[1].toString()
    }
}

// Convierte una lista de cartas de Prolog a un array de objetos de carta
function cardsFromList(xs) {
    var arr = [];
    while(pl.type.is_term(xs) && xs.indicator === "./2") {
        arr.push(convertCard(xs.args[0]));
        xs = xs.args[1];
    }
    if(pl.type.is_term(xs) && xs.indicator === "[]/0")
        return arr;
    return null;
}

// Dibuja una carta en el canvas
function drawCard(card, x, y) {
    // Determinamos el orden de las cartas en el spritesheet
    const suitOrder = ["hearts", "diamonds", "spades", "clubs", "back"]
    const cardOrder = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "jack", "queen", "king", "ace"]
    // Según la carta que sea, obtenemos su posición en el spritesheet
    const suitIndex = suitOrder.indexOf(card.suit)
    const cardIndex = cardOrder.indexOf(card.value)
    // Coordenadas de la carta en el spritesheet
    var cardWidth = 81, cardHeight = 117
    var cardX = cardWidth * cardIndex
    var cardY = cardHeight * suitIndex
    // Dibujamos la carta en el canvas
    ctx.drawImage(cardImage, cardX, cardY, cardWidth, cardHeight, x, y, cardWidth, cardHeight)
}

// Dibuja las cartas del jugador y del crupier en el canvas
function drawCards(playerCards, dealerCards, hideFirstCard) {
    // Establecemos la fuente
    ctx.font = "30px Arial"

    // Dibujamos las cartas del jugador
    ctx.fillText("Tú", 15, 40)
    for(var i = 0; i < playerCards.length; i++) {
        drawCard(playerCards[i], 15 + i * 100, 55)
    }

    // Dibujamos las cartas del crupier
    ctx.fillText("Crupier", 15, 220)
    for(var i = 0; i < dealerCards.length; i++) {
        if(i == 0 && hideFirstCard) {
            drawCard({suit: "back", value: "two"}, 15 + i * 100, 235)
        } else {
            drawCard(dealerCards[i], 15 + i * 100, 235)
        }
    }
}



