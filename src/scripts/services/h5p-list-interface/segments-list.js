import OptionsList from './options-list.js';

export default class SegmentsList {

  constructor(segmentsList, callbacks = {}) {
    this.list = segmentsList;
    this.callbacks = callbacks;

    this.handleOptionChanged = this.handleOptionChanged.bind(this);

    this.dom = this.getSegmentsListDOM();
    this.startObserver(this.dom);

    /*
     * Using event delegation instead of adding a listener to each option item
     * to prevent dozens of listeners.
     */
    this.dom.addEventListener('change', this.handleOptionChanged);

    this.listItems = [];
    this.listChildren = [];

    this.list.on('addedItem', (event) => {
      this.addSegment(event.data);
    });

    this.list.on('removedItem', (event) => {
      this.removeSegment(event.data);
    });

    this.list.forEachChild((group) => {
      this.addSegment(group);
    });
  }

  reset() {
    this.listItems = [];
    this.listChildren = [];
  }

  /**
   * Get id.
   * @returns {string} Id as assigned to by H5P core to list for its DOM.
   */
  getId() {
    return this.list.getId();
  }

  update() {
    this.listChildren = this.getListChildren();

    // Update listItems order if listChildren changed
    const moves = this.listItems
      .map((listItem, indexFrom) => {
        return ({
          from: indexFrom,
          to: this.listChildren.findIndex((child) => {
            return child.children[1] === listItem.list;
          })
        });
      })
      .filter((move) => move.from !== move.to);

    if (!moves.length) {
      return;
    }

    const listItemsClone = [...this.listItems];
    moves.forEach((move) => {
      this.listItems[move.to] = listItemsClone[move.from];
    });
  }

  /**
   * Get title.
   * @returns {string} title.
   */
  getTitle() {
    return this.titleField?.$input.get?.(0).value;
  }

  /**
   * Get title field.
   * @returns {H5PEditor.Text|null} Title field.
   */
  getTitleField() {
    let titleField = null;

    this.list.forEachChild((child) => {
      if (titleField) {
        return;
      }

      if (
        child instanceof H5PEditor.Group && child.field?.name === 'segments'
      ) {
        titleField = (child?.children || [])
          .find((groupItem) => groupItem.field?.name === 'title');
      }
    });

    return titleField;
  }

  /**
   * Get list children.
   * Used to determine order changes not signalled by H5P.List. Not using DOM
   * element, because not guaranteed to be identifiable if list widget such as
   * Vertical Tabs is used.
   * @returns {H5PEditor.Group[]} List children.
   */
  getListChildren() {
    const children = [];

    this.list.forEachChild((child) => {
      children.push(child);
    });

    return children;
  }

  /**
   * Add segment.
   * @param {H5PEditor.Group} group Group to add.
   */
  addSegment(group) {
    if (!(group instanceof H5PEditor.Group)) {
      return; // Should always be a "group" field
    }

    // H5PEditor.List does not create children field when using addItem().
    group.children = group.children ?? [];

    const optionsList = group.children.find((child) => {
      return child instanceof H5PEditor.List && child.getName() === 'options';
    });

    if (optionsList) {
      this.listItems.push(new OptionsList(optionsList));

      const segmentIndex = this.listItems.length - 1;

      const titleField = group.children.find((child) => {
        return child instanceof H5PEditor.Text && child.field?.name === 'title';
      });

      titleField.change((title) => {
        this.callbacks.onTitleChanged({
          segmentIndex: segmentIndex,
          title: title
        });
      });

      this.update();

      this.callbacks.onSegmentAdded({
        segmentIndex: this.listItems.length - 1,
        optionsList: optionsList
      });
    }
  }

  /**
   * Remove segment.
   * @param {number} index Index of segment to be removed.
   */
  removeSegment(index) {
    this.listItems.splice(index, 1);

    this.update();

    this.callbacks.onSegmentRemoved({
      segmentIndex: index
    });
  }

  /**
   * Get DOM of segments list for workaround for H5P.List to detect changes.
   * @returns {HTMLElement} DOM of segments list.
   */
  getSegmentsListDOM() {
    const findForm = (current) => {
      if (current instanceof H5PEditor.Form) {
        return current;
      }
      else if (!current.parent) {
        return null;
      }
      else {
        return findForm(current.parent);
      }
    };

    const form = findForm(this.list);
    if (!form?.$form) {
      return null;
    }

    // Could probably as well use querySelector on `document`.
    return form.$form.get(0)
      .querySelector(`[for="${this.getId()}"]`)?.parentNode;
  }

  getOptionsLists() {
    return this.listChildren;
  }

  /**
   * Get segment moves.
   * @returns {object} Moves as { moved: object[] }.
   */
  getMoves() {
    const currentChildren = this.getListChildren();

    const findIndex = (child) => {
      return currentChildren.findIndex((newChild) => newChild === child);
    };

    return this.listChildren
      .map((child, index) => ({ from: index, to: findIndex(child) }))
      .filter((move) => (move.from !== move.to));
  }

  /**
   * Start MutationObserver to detect list changes.
   * MutationObserver as workaround for H5P.List not announcing moves.
   * The whole logic could be simpler with one general H5P.List wrapper
   * filling in the missing functionality and then being used for the
   * options lists as well, but then we create multiple MutationObservers.
   * Not done for resource reasons.
   * @param {HTMLElement} dom DOM element to observe.
   */
  startObserver(dom) {
    if (!dom) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const targets = mutations.map((mutation) => mutation.target);

      const segmentsListItemIds = this.listItems.map((listItem) => {
        return listItem.getId();
      });

      if (
        // Check for id of segment list
        targets.some((target) => target.getAttribute('id') === this.getId())
      ) {
        const segmentsMoved = this.getMoves();
        if (segmentsMoved.length) {
          this.update();

          this.callbacks.onSegmentMoved({
            moved: segmentsMoved
          });
        }

        return;
      }

      if (
        // Check for id of options list
        targets.some(
          (target) => segmentsListItemIds.includes(target.getAttribute('id')))
      ) {
        let done = false;
        this.listItems.forEach((listItem, index) => {
          if (done) {
            return;
          }

          // Check list item for changes, only one can happen at a time
          const changes = listItem.getChanges();

          if (changes.added !== -1) {
            listItem.update();

            this.callbacks.onOptionAdded({
              segmentIndex: index,
              optionIndex: changes.added
            });

            return;
          }
          else if (changes.removed !== -1) {
            listItem.update();

            this.callbacks.onOptionRemoved({
              segmentIndex: index,
              optionIndex: changes.removed
            });

            return;
          }
          else if (changes.moved.length > 0) {
            listItem.update();

            this.callbacks.onOptionMoved({
              segmentIndex: index,
              moved: changes.moved
            });
          }
        });
      }
    });

    observer.observe(dom, { childList: true, subtree: true });
  }

  /**
   * Find option by id.
   * @param {string} id to look for.
   * @returns {object|null} Option or null if not found.
   */
  findOptionById(id) {
    return this.listItems.reduce((option, listItem) => {
      return option ?? listItem.findOptionById(id);
    }, null);
  }

  /**
   * Get index of segment that contains an option.
   * @param {object} option Option to look for.
   * @returns {number} Index of segment that contains option.
   */
  getSegmentIndexForOption(option) {
    return this.listItems.findIndex((listItem) => {
      return listItem.includes(option);
    });
  }

  /**
   * Handle option change.
   * @param {InputEvent} event Event.
   */
  handleOptionChanged(event) {
    if (event.target.tagName.toLowerCase() !== 'input') {
      return;
    }

    const targetId = event.target.getAttribute('id');

    const option = this.findOptionById(targetId);
    if (!option) {
      return;
    }

    this.callbacks.onOptionLabelChanged({
      segmentIndex: this.getSegmentIndexForOption(option),
      optionIndex: option.getIndex(),
      text: option.getLabel()
    });
  }
}
