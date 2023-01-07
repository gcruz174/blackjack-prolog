:- use_module(library(random)).
:- use_module(library(lists)).

% cards/2 devuelve todas las cartas en una baraja de cartas
cards(Deck) :-
    Suits = [spades, hearts, clubs, diamonds],
    Cards = [ace, two, three, four, five, six, seven, eight, nine, ten, jack, queen, king],
    findall(card(Suit, Card), (member(Suit, Suits), member(Card, Cards)), Deck).

% value/2 devuelve el valor de una carta
value(card(_, ace), 11).
value(card(_, two), 2).
value(card(_, three), 3).
value(card(_, four), 4).
value(card(_, five), 5).
value(card(_, six), 6).
value(card(_, seven), 7).
value(card(_, eight), 8).
value(card(_, nine), 9).
value(card(_, ten), 10).
value(card(_, jack), 10).
value(card(_, queen), 10).
value(card(_, king), 10).

% shuffle/2 baraja una lista de cartas de manera aleatoria
shuffle(Cards, Shuffled) :-
    random_permutation(Cards, Shuffled).

% draw_card/2 elimina la primera carta de una baraja y la devuelve
draw_card([Card | Rest], Card, Rest).

% draw_card_into_hand/3 agrega una carta a una mano de cartas
draw_card_into_hand(Deck, NewDeck, Hand, NewHand) :-
    draw_card(Deck, Card, NewDeck),
    append(Hand, [Card], NewHand).

% score/2 calcula el puntaje de una mano de cartas
score(Hand, Score) :-
    score(Hand, 0, Score).

% score/3 es un predicado auxiliar para score/2
score([], Acc, Acc).
score([card(_, Type) | Rest], Acc, Score) :-
    value(card(_, Type), Value),
    (Type = ace, Acc + 11 > 21 ->
        NewAcc is Acc + 1
    ;   NewAcc is Acc + Value),
    score(Rest, NewAcc, Score).

% initial_setup/3 inicializa el juego de blackjack repartiendo dos cartas a cada jugador
% y devuelve las cartas de cada jugador y el resto de la baraja
initial_setup(PlayerCards, DealerCards, Rest4) :-
    cards(Deck),
    shuffle(Deck, ShuffledDeck),
    draw_card(ShuffledDeck, PlayerCard1, Rest1),
    draw_card(Rest1, DealerCard1, Rest2),
    draw_card(Rest2, PlayerCard2, Rest3),
    draw_card(Rest3, DealerCard2, Rest4),
    PlayerCards = [PlayerCard1, PlayerCard2],
    DealerCards = [DealerCard1, DealerCard2].

% dealer_turn/2 juega el turno del crupier hasta que su puntaje sea mayor o igual a 17
dealer_turn(Deck, DealerCards, NewDealerCards) :-
    score(DealerCards, DealerSum),
    DealerSum < 17,
    draw_card_into_hand(Deck, NewDeck, DealerCards, NewDealerCards),
    dealer_turn(NewDeck, NewDealerCards, NewDealerCards).
dealer_turn(Deck, DealerCards, DealerCards).

% determine_winner/3 determina el ganador del juego
determine_winner(PlayerCards, DealerCards, Winner) :-
    score(PlayerCards, PlayerScore),
    score(DealerCards, DealerScore),
    (PlayerScore > 21 ->
        Winner = dealer
    ;   DealerScore > 21 ->
        Winner = player
    ;   PlayerScore > DealerScore ->
        Winner = player
    ;   DealerScore > PlayerScore ->
        Winner = dealer
    ;   Winner = push).

% has_player_busted/1 devuelve true si el jugador se pasó de 21
has_player_busted(PlayerCards) :-
    score(PlayerCards, PlayerSum),
    PlayerSum > 21.