const Sortable = require('sortablejs');
const tagModule = require('./tag');

const cardModule = {
  base_url: "http://localhost:5050",
  // for AWS:
  // base_url: "",

  setBaseUrl: (url) => {
    cardModule.base_url = url + '/cards';
  },

  // using Sortable to manage card drag and drop
  newCardSortable: () => {
    const sortableCards = document.querySelectorAll('.panel-block');
    for (let i = 0; i < sortableCards.length; i++) {
      sortableCards[i].setAttribute('id', `sortableCard${i}`);
      const id = document.getElementById(`sortableCard${i}`);
      new Sortable(id, {
        group: "list",
        filter: ".no-drag",
        preventOnFilter: false,
        forceFallback: true,
        animation: 140,
        onUpdate: function () {
          const cards = sortableCards[i].querySelectorAll('.box');
          for (let i = 0; i < cards.length; i++) {
            const cardId = cards[i].getAttribute('card-id');
            cardModule.handleEditCardPosition(cardId, i);
          };
        },
        onAdd: function(evt) {
          const cardCloned = evt.clone;
          const cardClonedId = cardCloned.getAttribute('card-id');
          const newList = evt.to.closest('.panel');
          const newListId = newList.getAttribute('list-id');
          cardModule.handleAddClonedCard(cardClonedId, newListId);
          const cards = sortableCards[i].querySelectorAll('.box');
          for (let i = 0; i < cards.length; i++) {
            const cardId = cards[i].getAttribute('card-id');
            cardModule.handleEditCardPosition(cardId, i);
          };
        },
      });
    };
  },

  // adding cloned card to the new list
  handleAddClonedCard: async (cardClonedId, newListId) => {
    try {
      const data = new FormData();
      data.append('list_id', newListId);
      let response = await fetch(cardModule.base_url + '/' + cardClonedId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      }
    } catch (error) {
      alert("Unable to modify the list of the card.");
      console.error(error);
    }
  },

  // using Sortable to manage tag navbar drag and drop
  newTagNavbarSortable: () => {
    const sortableTagNavbar = document.getElementById('tagsNavbar');
    new Sortable(sortableTagNavbar, {
      group: {
        name: "card",
        pull: "clone",
        revertClone: true,
      },
      filter: ".no-drag",
      preventOnFilter: false,
      animation: 140,
    });
  },

  // adding cloned tag to the new card
  handleAddClonedTag: async (tagClonedId, newCard, newCardId) => {
    try {
      let nextElement = newCard.nextElementSibling;
      const data = new FormData();
      data.append('tagId', tagClonedId);
      let response = await fetch(cardModule.base_url + '/' + newCardId + '/tags', {
        method: "POST",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let card = await response.json();
        cardModule.removeCardInDom(newCardId);
        cardModule.makeCardInDOM(nextElement, card.content, card.list_id, card.id, card.color);
        if (card.tags) {
          for (let tag of card.tags) {
            cardModule.makeTagInDom(tag.name, card.id, tag.id, tag.color);
          };
        };
      }
    } catch (error) {
      alert("Unable to add the tag to the card.");
      console.error(error);
    }
  },

  // managing card positions when Sortable events occur
  handleEditCardPosition: async (cardId, newPosition) => {
    try {
      const data = new FormData();
      data.append('position', newPosition);
      let response = await fetch(cardModule.base_url + '/' + cardId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      }
    } catch (error) {
      alert("Unable to modify the position of the card.");
      console.error(error);
    }
  },

  // displaying "create a card" modal
  showAddCardModal: (event) => {
    let listElement = event.target.closest('.panel');
    const listId = listElement.getAttribute('list-id');
    let modal = document.getElementById('addCardModal');
    let input = modal.querySelector('input[name="list_id"]');
    input.value = listId;
    modal.classList.add('is-active');
  },

  // completed form action: adding a card
  handleAddCardForm: async (event) => {
    let data = new FormData(event.target);
    data.set('color', data.get('color').substring(1));
    let nextElement = null;
    try {
      let response = await fetch(cardModule.base_url, {
        method: "POST",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let card = await response.json();
        cardModule.makeCardInDOM(nextElement, card.content, card.list_id, card.id, card.color);
      }
    } catch (error) {
      alert("Unable to create the card.");
      console.error(error);
    }
  },

  // displaying card editing form
  showEditCardForm: (event) => {
    let cardElement = event.target.closest('.box');
    let formElement = cardElement.querySelector('form');
    let titleElement = cardElement.querySelector('.card-name');
    formElement.querySelector('input[name="content"]').value = titleElement.textContent;
    titleElement.classList.add('is-hidden');
    formElement.classList.remove('is-hidden');
  },

  // completed form action: editing card
  handleEditCardForm: async (event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    data.set('color', data.get('color').substring(1));
    let cardElement = event.target.closest('.box');
    const cardId = cardElement.getAttribute('card-id');
    try {
      let response = await fetch(cardModule.base_url + '/' + cardId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let card = await response.json();
        cardElement.querySelector('.card-name').textContent = card.content;
        cardElement.setAttribute('style', 'background-color: #' + card.color);
      }
    } catch (error) {
      alert("Unable to modify the card.");
      console.error(error);
    }
    event.target.classList.add('is-hidden');
    cardElement.querySelector('.card-name').classList.remove('is-hidden');
  },

  // deleting card
  handleDeleteCard: async (event) => {
    event.preventDefault();
    let cardElement = event.target.closest('.box');
    const cardId = cardElement.getAttribute('card-id');
    try {
      let response = await fetch(cardModule.base_url + '/' + cardId, {
        method: "DELETE"
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let card = await response.json();
        cardElement.remove();
      }
    } catch (error) {
      alert("Unable to delete the card.");
      console.error(error);
    }
  },

  // deleting tag from card
  handleRemoveTagFromCard: async (event) => {
    event.preventDefault();
    let tagElement = event.target.closest('.tag');
    tagId = tagElement.getAttribute('tag-id');
    let cardElement = event.target.closest('.box');
    let nextElement = cardElement.nextElementSibling;
    const cardId = cardElement.getAttribute('card-id');
    try {
      let response = await fetch(cardModule.base_url + '/' + cardId + '/tags/' + tagId, {
        method: "DELETE"
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let card = await response.json();
        cardModule.removeCardInDom(cardId);
        cardModule.makeCardInDOM(nextElement, card.content, card.list_id, card.id, card.color);
        if (card.tags) {
          for (let tag of card.tags) {
            cardModule.makeTagInDom(tag.name, card.id, tag.id, tag.color);
          };
        };
      }
    } catch (error) {
      alert('Unable to delete the tag from the card.');
      console.error(error);
    }
  },

  // deleting a card from DOM
  removeCardInDom: (cardId) => {
    const card = document.querySelector(`[card-id="${cardId}"]`);
    card.remove();
  },

  // creating a card in DOM
  makeCardInDOM: (nextElement, cardContent, listId, cardId, cardColor) => {
    let template = document.getElementById('template-card');
    let newCard = document.importNode(template.content, true);
    newCard.querySelector('.card-name').textContent = cardContent;
    let box = newCard.querySelector('.box');
    box.setAttribute('card-id', cardId);
    box.querySelector('.tags').setAttribute('id', `sortableTag${cardId}`);
    box.setAttribute('style', 'background-color: #' + cardColor);
    newCard.querySelector('.button--edit-card').addEventListener('click', cardModule.showEditCardForm);
    newCard.querySelector('.button--delete-card').addEventListener('click', cardModule.handleDeleteCard);
    newCard.querySelector('form').addEventListener('submit', cardModule.handleEditCardForm);
    newCard.querySelector('.button--add-tag').addEventListener('click', tagModule.showAddTagToCardModal);
    let theGoodList = document.querySelector(`[list-id="${listId}"]`);
    if (nextElement !== null) {
      theGoodList.querySelector('.panel-block').insertBefore(newCard, nextElement);
    } else {
      theGoodList.querySelector('.panel-block').appendChild(newCard);
    };
    const id = document.getElementById(`sortableTag${cardId}`);
    
    // using Sortable to handle tag drag and drop
    new Sortable(id, {
      group: {
        name: "card",
        pull: false,
      },
      filter: ".no-drag",
      preventOnFilter: false,
      animation: 140,
      onAdd: function(evt) {
        const tagCloned = evt.clone;
        const tagClonedId = tagCloned.getAttribute('tag-id');
        const newCard = evt.to.closest('.box');
        const newCardId = newCard.getAttribute('card-id');
        cardModule.handleAddClonedTag(tagClonedId, newCard, newCardId);
      },
    });
    cardModule.newCardSortable();
  },

  // creating a tag from a card in DOM
  makeTagInDom: (tagName, cardId, tagId, tagColor) => {
    let template = document.getElementById('template-tag');
    let buttonDelete = document.getElementById('template-tag-delete');
    let newTag = document.importNode(template.content, true);
    let newButtonDelete = document.importNode(buttonDelete.content, true);
    newTag.querySelector('.tag').textContent = `${tagName}`;
    newTag.querySelector('.tag').appendChild(newButtonDelete);
    newTag.querySelector('.delete').addEventListener('click', cardModule.handleRemoveTagFromCard);
    let box = newTag.querySelector('.tag');
    box.setAttribute('tag-id', tagId);
    box.setAttribute('style', 'background-color: #' + tagColor);
    let theGoodCard = document.querySelector(`[card-id="${cardId}"]`);
    theGoodCard.querySelector('.tags').insertBefore(newTag, theGoodCard.querySelector('.button--add-tag'));
  },
  
};

module.exports = cardModule;