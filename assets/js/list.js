const Sortable = require('sortablejs');
const cardModule = require('./card');

const listModule = {
  // base_url: "http://localhost:5050",
  // for AWS:
  base_url: "",

  setBaseUrl: (url) => {
    listModule.base_url = url + '/lists';
  },

  // using Sortable to handle list drag and drop
  newListSortable: () => {
    new Sortable(sortableList, {
      filter: ".no-drag",
      preventOnFilter: false,
      forceFallback: true,
      animation: 140,
      onEnd: function () {
        const lists = document.querySelectorAll('.panel');
        for (let i = 0; i < lists.length; i++) {
          const listId = lists[i].getAttribute('list-id');
          listModule.handleEditListPosition(listId, i);
        };
      },
    });
  },

  // method to handle list positions in database after drag and drop changes
  handleEditListPosition: async (listId, newPosition) => {
    try {
      const data = new FormData();
      data.append('position', newPosition);
      let response = await fetch(listModule.base_url + '/' + listId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      }
    } catch (error) {
      alert("Unable to modify the list position.");
      console.error(error);
    }
  },

  // displaying "create a list" modal
  showAddListModal: () => {
    let modal = document.getElementById('addListModal');
    modal.classList.add('is-active');
  },

  // completed form action: adding a list
  handleAddListForm: async (event) => {
    let data = new FormData(event.target);
    let nbListes = document.querySelectorAll('.panel').length;
    data.set('position', nbListes);
    try {
      let response = await fetch(listModule.base_url, {
        method: "POST",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        const list = await response.json();
        listModule.makeListInDom(list.name, list.id);
      }
    } catch (error) {
      alert("Unable to create the list.");
      console.error(error);
    }
  },

  // displaying list editing form
  showEditListForm: (event) => {
    let listElement = event.target.closest('.panel');
    let formElement = listElement.querySelector('form');
    formElement.querySelector('input[name="name"]').value = event.target.textContent;
    event.target.classList.add('is-hidden');
    formElement.classList.remove('is-hidden');
  },

  // handling display of dropdown list for tag settings
  showTagEditButtons: (event) => {
    let tagDropdown = document.getElementById('tagDropdown');
    if (tagDropdown.classList.contains('is-active')) {
      tagDropdown.classList.remove('is-active');
    } else {
      tagDropdown.classList.add('is-active');
    }
  },

  // completed form action: modifying a list
  handleEditListForm: async (event) => {
    event.preventDefault();
    let data = new FormData(event.target);
    let listElement = event.target.closest('.panel');
    const listId = listElement.getAttribute('list-id');
    try {
      let response = await fetch(listModule.base_url + '/' + listId, {
        method: "PATCH",
        body: data
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let list = await response.json();
        listElement.querySelector('h2').textContent = list.name;
      }
    } catch (error) {
      alert("Unable to modify the list.");
      console.error(error);
    }
    event.target.classList.add('is-hidden');
    listElement.querySelector('h2').classList.remove('is-hidden');
  },

  // deleting a list
  handleDeleteList: async (event) => {
    event.preventDefault();
    let listElement = event.target.closest('.panel');
    const listId = listElement.getAttribute('list-id');
    try {
      let response = await fetch(listModule.base_url + '/' + listId, {
        method: "DELETE"
      });
      if (!response.ok) {
        let error = await response.json();
        throw error;
      } else {
        let list = await response.json();
        listElement.remove();
      }
    } catch (error) {
      alert("Unable to delete the list");
      console.error(error);
    }
  },

  // creating list in DOM
  makeListInDom: (listName, listId) => {
    let template = document.getElementById('template-list');
    let newList = document.importNode(template.content, true);
    newList.querySelector('h2').textContent = listName;
    newList.querySelector('.panel').setAttribute('list-id', listId);
    newList.querySelector('.button--add-card').addEventListener('click', cardModule.showAddCardModal);
    newList.querySelector('.button--delete-list').addEventListener('click', listModule.handleDeleteList);
    newList.querySelector('h2').addEventListener('dblclick', listModule.showEditListForm);
    newList.querySelector('form').addEventListener('submit', listModule.handleEditListForm);
    document.getElementById('sortableList').appendChild(newList);
  },

};

module.exports = listModule;