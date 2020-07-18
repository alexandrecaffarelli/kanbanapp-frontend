const cardModule = require('./card');
const listModule = require('./list');
const tagModule = require('./tag');

var app = {
  // base url for our api !
  base_url: "http://localhost:5050",
  // for AWS:
  // base_url: "",
  // init function, launched once page has loaded
  init: function () {
    listModule.setBaseUrl(app.base_url);
    cardModule.setBaseUrl(app.base_url);
    tagModule.setBaseUrl(app.base_url);
    app.getListsFromAPI();
    app.getTagsFromAPI();
    app.addListenerToActions();
  },

  // adding listeners to static buttons and forms
  addListenerToActions: () => {
    // escape key management to hide modals
    document.addEventListener('keyup', event => {
      if (event.key === "Escape" ) {
        app.hideModals();
      };
    });

    // dropdown button for tag settings
    let tagDropdown = document.getElementById('tagDropdown');
    tagDropdown.addEventListener('click', listModule.showTagEditButtons);

    // add list button
    let addListButton = document.getElementById('addListButton');
    addListButton.addEventListener('click', listModule.showAddListModal);

    // add tag buttons
    let addTagButton = document.getElementById('addTagButton');
    addTagButton.addEventListener('click', tagModule.showAddTagModal);
    let addTagNavButton = document.getElementById('addTagNavButton');
    addTagNavButton.addEventListener('click', tagModule.showAddTagModal);

    // modify tag button
    let modifyTagButton = document.getElementById('modifyTagButton');
    modifyTagButton.addEventListener('click', tagModule.showModifyTagModal);

    // delete tag button
    let removeTagButton = document.getElementById('removeTagButton');
    removeTagButton.addEventListener('click', tagModule.showRemoveTagModal);

    // close modals buttons
    let closeModalButtons = document.querySelectorAll('.close');
    for (let button of closeModalButtons) {
      button.addEventListener('click', app.hideModals);
    }

    // add list form
    let addListForm = document.querySelector('#addListModal form');
    addListForm.addEventListener('submit', app.handleAddListForm);

    // add tag form
    let addTagForm = document.querySelector('#addTagModal form');
    addTagForm.addEventListener('submit', app.handleAddTagForm)

    // add card buttons
    let addCardButtons = document.querySelectorAll('.button--add-card');
    for (let button of addCardButtons) {
      button.addEventListener('click', cardModule.showAddCardModal);
    };

    // add card form
    let addCardForm = document.querySelector('#addCardModal form');
    addCardForm.addEventListener('submit', app.handleAddCardForm);

    // delete tag form
    let removeTagForm = document.querySelector('#removeTagModal form');
    removeTagForm.addEventListener('submit', app.handleDeleteTag);

    // add tag to card form
    let addTagToCardForm = document.querySelector('#addTagToCardModal form');
    addTagToCardForm.addEventListener('submit', app.handleAddTagToCard);

    // modify tag form
    let modifyTagForm = document.querySelector('#modifyTagModal form');
    modifyTagForm.addEventListener('submit', app.handleModifyTag);
  },

  // function to pull details about existing lists, cards and tags from database
  getListsFromAPI: async () => {
    try {
      let response = await fetch(app.base_url + "/lists");
      let nextElement = null;
      // testing HTTP code
      if (!response.ok) {
        // if response != ok => issue.
        // we receive the body error response and throw it into the below catch
        let error = await response.json();
        throw error;
      } else {
        // if all went well : we proceed with creating existing lists, cards and tags in DOM
        let lists = await response.json();
        for (let list of lists) {
          listModule.makeListInDom(list.name, list.id);
          for (let card of list.cards) {
            cardModule.makeCardInDOM(nextElement, card.content, list.id, card.id, card.color);
            if (card.tags) {
              for (let tag of card.tags) {
                cardModule.makeTagInDom(tag.name, card.id, tag.id, tag.color);
              };
            };
          }
        }
        // setting up sortable functions to handle drag and drop for lists, cards and tags
        listModule.newListSortable();
        cardModule.newCardSortable();
        cardModule.newTagNavbarSortable();
      }
    } catch (error) {
      // in case of error, we display a message to the user
      alert("Unable to load the lists from API.");
      // and we console log the error for further details
      console.error(error);
    }
  },

  // function to pull details about existing tags from database to tag navbar
  getTagsFromAPI: async () => {
    try {
      let response = await fetch(app.base_url + "/tags");
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let tags = await response.json();
        for (let tag of tags) {
          app.makeTagInNavDom(tag.name, tag.id, tag.color);
        }
      }
    } catch (error) {
      alert("Unable to load tags from API.");
      console.error(error);
    }
  },

  // function to create a tag in DOM tag navbar
  makeTagInNavDom: (tagName, tagId, tagColor) => {
    // getting the tag template
    let template = document.getElementById('template-tag');
    let buttonDelete = document.getElementById('template-tag-delete');
    // creating a clone
    let newTag = document.importNode(template.content, true);
    let newButtonDelete = document.importNode(buttonDelete.content, true);
    // tweaking the values
    newTag.querySelector('.tag').textContent = `${tagName}`;
    newTag.querySelector('.tag').appendChild(newButtonDelete);
    newTag.querySelector('.delete').addEventListener('click', app.handleDeleteTagFromNav);
    let box = newTag.querySelector('.tag');
    box.setAttribute('tag-id', tagId);
    box.setAttribute('style', 'background-color: #' + tagColor);
    // insert the new tag in the tag navbar
    let navBar = document.getElementById(`tagsNavbar`);
    navBar.insertBefore(newTag, navBar.querySelector('.button--add-tag'));
  },

  // clearing all form inputs
  clearAllInputs: () => {
    const inputs = document.querySelectorAll('.input');
    for (const input of inputs) {
      input.value = '';
    };
  },

  // hiding all modals
  hideModals: () => {
    app.clearAllInputs();
    tagModule.resetTagModal();
    let modals = document.querySelectorAll('.modal');
    for (let modal of modals) {
      modal.classList.remove('is-active');
    }
  },

  // completed form action: adding a list
  handleAddListForm: async (event) => {
    event.preventDefault();
    await listModule.handleAddListForm(event);
    app.hideModals();
  },

  // completed form action: creating a new tag
  handleAddTagForm: async (event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    data.set('color', data.get('color').substring(1));
    try {
      let response = await fetch(tagModule.base_url, {
        method: "POST",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        const tag = await response.json();
        app.makeTagInNavDom(tag.name, tag.id, tag.color);
      }
    } catch (error) {
      alert("Unable to create the tag.");
      console.error(error);
    }
    app.hideModals();
  },

  // completed form action: adding a card
  handleAddCardForm: async (event) => {
    event.preventDefault();
    await cardModule.handleAddCardForm(event);
    app.hideModals();
  },

  // completed form action: modifying a list
  handleEditListForm: async (event) => {
    event.preventDefault();
    await listModule.handleEditListForm(event);
    app.clearAllInputs();
  },

  // completed form action: deleting a tag from database
  handleDeleteTag: async (event) => {
    event.preventDefault();
    console.log(event.target);
    let data = new FormData(event.target);
    const tagId = (data.get('tag_id'));
    try {
      let response = await fetch(app.base_url + '/tags/' + tagId, {
        method: "DELETE"
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        app.resetListsInDom();
      }
    } catch (error) {
      alert("Unable to delete the tag.");
      console.error(error);
    }
    app.hideModals();
  },

  // navbar action: deleting a tag from database
  handleDeleteTagFromNav: async (event) => {
    event.preventDefault();
    const tagElement = event.target.closest('.tag');
    const tagId = tagElement.getAttribute('tag-id');
    console.log(tagElement);
    console.log(tagId);
    try {
      let response = await fetch(app.base_url + '/tags/' + tagId, {
        method: "DELETE"
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        app.resetListsInDom();
      }
    } catch (error) {
      alert("Unable to delete the tag.");
      console.error(error);
    }
  },

  // completed form action: modifying a tag
  handleModifyTag: async (event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    data.set('color', data.get('color').substring(1));
    const tagId = data.get('tag_id');
    try {
      let response = await fetch(app.base_url + '/tags/' + tagId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        app.resetListsInDom();
      }
    } catch (error) {
      alert("Unable to modify the tag");
      console.error(error);
    }
    app.hideModals();
  },

  // completed form action: adding a tag to a card
  handleAddTagToCard: async(event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    const cardId = data.get('card_id');
    const cardElement = document.querySelector(`[card-id="${cardId}"]`);
    const nextElement = cardElement.nextElementSibling;
    try {
      let response = await fetch(app.base_url + '/cards/' + cardId + '/tags', {
        method: "POST",
        body: data
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
      alert("Unable to add the tag to the card");
      console.error(error);
    }
    app.hideModals();
  },

  // resetting all lists from DOM
  resetListsInDom: () => {
    const lists = document.querySelectorAll('.panel');
    for (const list of lists) {
      list.remove();
    };
    const tags = document.querySelectorAll('.tag');
    for (const tag of tags) {
      tag.remove();
    };
    app.getListsFromAPI();
    app.getTagsFromAPI();
  },

};

// adding a listener to the document: when page is loaded, app is launched
document.addEventListener('DOMContentLoaded', app.init);