const tagModule = {
    base_url: "http://localhost:5050",
    // for AWS:
    // base_url: "",
  
    setBaseUrl: (url) => {
      tagModule.base_url = url + '/tags';
    },
  
    // function to pull details about existing tags from database
    getTagsFromAPI: async(requestType) => {
      try {
        let response = await fetch(tagModule.base_url);
        if (!response.ok) {
          let error = await response.json();
          throw error;
        } else {
          let tags = await response.json();
          for (let tag of tags) {
            tagModule.makeTagsListinDom(tag.name, tag.id, tag.color, requestType);
          };
        }
      } catch (error) {
        alert("Unable to load tags from API.");
        console.error(error);
      }
    },
  
    // displaying "create a tag" modal
    showAddTagModal: () => {
      let modal = document.getElementById('addTagModal');
      modal.classList.add('is-active');
    },
  
    // displaying "modify a tag" modal
    showModifyTagModal: async () => {
      try {
        const requestType = 'modify';
        await tagModule.getTagsFromAPI(requestType);
        let modal = document.getElementById('modifyTagModal');
        modal.classList.add('is-active');
      } catch (error) {
        alert("Unable to modify the tag.");
        console.error(error);
      }
    },
  
    // displaying "delete a tag" modal
    showRemoveTagModal: async () => {
      try {
        const requestType = 'remove';
        await tagModule.getTagsFromAPI(requestType);
        let modal = document.getElementById('removeTagModal');
        modal.classList.add('is-active');
      } catch (error) {
        alert("Unable to delete the tag.");
        console.error(error);
      }
    },
  
    // displaying "adding a tag to a card" modal
    showAddTagToCardModal: async () => {
      try {
        const requestType = 'add';
        let cardElement = event.target.closest('.box');
        const cardId = cardElement.getAttribute('card-id');
        let modal = document.getElementById('addTagToCardModal');
        let input = modal.querySelector('input[name="card_id"]');
        input.value = cardId;
        await tagModule.getTagsFromAPI(requestType);
        modal.classList.add('is-active');
      } catch (error) {
        alert("Unable to add the tag to the card.");
        console.error(error);
      }
    },
  
    // resetting tag options creation
    resetTagModal: () => {
      const selectForms = document.querySelectorAll('.form-control');
      for (const selectForm of selectForms) {
        const length = selectForm.options.length - 1;
        for (let i = length; i >= 1; i--) {
          selectForm.remove(i);
        };
      };
    },
  
    // creating a dropdown list for tags in related modals
    makeTagsListinDom: (tagName, tagId, tagColor, requestType) => {
      let template = document.getElementById('template-tag-option');
      let newTagOption = document.importNode(template.content, true);
      newTagOption.querySelector('option').value = `${tagId}`;
      newTagOption.querySelector('option').textContent = `${tagName}`;
      if (requestType === 'remove') {
        const childOption = document.getElementById('removeTagModal');
        childOption.querySelector('.tag-remove-option').after(newTagOption);
      } else if (requestType === 'add') {
        const childOption = document.getElementById('addTagToCardModal');
        childOption.querySelector('.tag-remove-option').after(newTagOption);
      } else if (requestType === 'modify') {
        const childOption = document.getElementById('modifyTagModal');
        childOption.querySelector('.tag-remove-option').after(newTagOption);
      };
    },
  
  };
  
  module.exports = tagModule;