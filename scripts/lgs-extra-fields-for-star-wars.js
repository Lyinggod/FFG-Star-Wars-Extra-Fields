const MODULE_ID = "lgs-extra-fields-for-star-wars";
const SETTINGS_KEY = "customFields";

Hooks.once("init", function() {
  console.log(`${MODULE_ID} | Initializing module...`);

  // store group name, fild name
  game.settings.register(MODULE_ID, SETTINGS_KEY, {
    name: "Custom Fields",
    scope: "world",
    config: false,
    type: Array, // Changed from Object to Array for better handling
    default: []
  });

  // Register dialog
  game.settings.registerMenu(MODULE_ID, "customFieldsMenu", {
    name: "Custom Fields",
    label: "Custom Fields",
    hint: "Define custom fields to actors",
    icon: "fas fa-plus",
    type: CustomFieldsConfigDialog,  // Class defined below
    restricted: true
  });
});


Hooks.on("preCreateActor", async (actor, createData, options, userId) => {
  // Skip if actor is type vehicle
  if (actor.type === "vehicle") return;

  // If flags already exist, no need to do the below
  if (actor.flags?.[MODULE_ID]?.extraFields) return;

  // Otherwise, pull the global custom fields from the world settings
  const storedFields = game.settings.get(MODULE_ID, SETTINGS_KEY);
  if (!Array.isArray(storedFields)) return;

  // Build an array of objects based on the stored fields
  const extraFields = storedFields.map(f => {
    return {
      group: f.group ?? "",
      name: f.name ?? "",
      value: 0
    };
  });

  // Attach them as default flags to the new Actor
  actor.updateSource({
    [`flags.${MODULE_ID}.extraFields`]: extraFields
  });
});


Hooks.on("renderActorSheet", async (app, html, data) => {
  const actor = app.object;
  console.info(`${MODULE_ID} | Rendering sheet for actor: ${actor.name}`);

  if (!actor) return;
  if (actor.type === "vehicle") return;

  // If the flag array doesn't exist, initialize it from the global setting
  let extraFields = actor.getFlag(MODULE_ID, "extraFields");
  if (!Array.isArray(extraFields)) {
    extraFields = [];
  }

  // Pull the global custom fields
  const storedFields = game.settings.get(MODULE_ID, SETTINGS_KEY);
  if (!Array.isArray(storedFields)) return;

  // Remove any extraFields entries in flags that do not match global settings
  const validFieldsSet = new Set(storedFields.map(f => `${f.group}||${f.name}`));
  const filteredExtraFields = extraFields.filter(f => validFieldsSet.has(`${f.group}||${f.name}`));

  if (filteredExtraFields.length !== extraFields.length) {
    console.log(`${MODULE_ID} | Removing non-matching extraFields from actor: ${actor.name}`);
    await actor.update({
      [`flags.${MODULE_ID}.extraFields`]: filteredExtraFields
    });
    extraFields = filteredExtraFields;
  }

  // Ensure all global settings are present in the actor's flags
  const missingFields = storedFields.filter(sf => 
    !extraFields.some(ef => ef.group === sf.group && ef.name === sf.name)
  );

  if (missingFields.length > 0) {
    const newExtraFields = missingFields.map(f => ({
      group: f.group ?? "",
      name: f.name ?? "",
      value: 0
    }));
    console.log(`${MODULE_ID} | Adding missing extraFields to actor: ${actor.name}`);
    await actor.update({
      [`flags.${MODULE_ID}.extraFields`]: [...extraFields, ...newExtraFields]
    });
    extraFields = [...extraFields, ...newExtraFields];
  }


  // Check if the current order matches the global settings
  const isOrderMatching = storedFields.every((sf, index) => {
    const ef = extraFields[index];
    return ef && ef.group === sf.group && ef.name === sf.name;
  });

  if (!isOrderMatching) {
    // Reorder extraFields to match the order of storedFields
    const reorderedExtraFields = storedFields.map(sf => {
      return extraFields.find(ef => ef.group === sf.group && ef.name === sf.name);
    }).filter(ef => ef !== undefined); // Ensure no undefined entries

    // Update the actor's flags with the reordered array
    await actor.update({
      [`flags.${MODULE_ID}.extraFields`]: reorderedExtraFields
    });

    // Update the local variable to reflect the new order
    extraFields = reorderedExtraFields;

    console.log(`${MODULE_ID} | Reordered extraFields for actor: ${actor.name}`);
  }

  // Now inject HTML into the sheet
  const customFields = game.settings.get("lgs-extra-fields-for-star-wars", "customFields");
  const uniqueGroupNames = new Set(customFields.map(field => field.group));
  console.info("customFields",customFields)
  const customFieldQty = uniqueGroupNames.size;
  const divSize = customFieldQty <= 3 ? `fields${customFieldQty}` : "";
  //const gridSize = customFieldQty <= 4 ? 4 : customFieldQty;
  const customFieldGrid = `grid grid-${customFieldQty}col` 
  
  let activeSheet = actor.getFlag("core", "sheetClass");
  let activeAltSheet = CONFIG.Actor.sheetClasses?.character["starwarsffg.ffgalternateactorsheet"]?.default
  let anchorContainers = "";
  let extraPadding = "";
  if (activeAltSheet || (activeSheet && activeSheet.toLowerCase() === "starwarsffg.ffgalternateactorsheet")) {
    anchorContainers = html.find('div.container.stats-block div.container.flex-group-center');
    extraPadding = `style="padding-top:5px;"`;
    const statsBlock = html.find('div.container.stats-block');
    // Remove the 'flex-wrap: nowrap' style if it exists
    statsBlock.css('flex-wrap', '');
  } else {
    anchorContainers = html.find('div.header-fields div.container.flex-group-center'); 
	anchorContainers.parent().css('flex-wrap', '');
  }
  
  if (actor.type == "minion"){
	  anchorContainers = html.find('div.minion-name div.container'); 
  }

  if (!anchorContainers.length) return;
  
  const centerDiv = actor.type != "minion" ? "main" : "";
   // wrapper for width of custom field area
   const wrapper = $(`<div ${extraPadding} class="customFields ${actor.type} ${centerDiv}"></div>`);
  
  const container = $(
    `<div class="${customFieldGrid} ${divSize} flex-group-center ${MODULE_ID}-custom-fields"></div>`
  );
  
// Append the inner container to the outer wrapper
wrapper.append(container);

// Append the wrapper to the anchor containers
anchorContainers.after(wrapper);

  // Group the fields by "group" name
  const fieldsByGroup = {};
  extraFields.forEach(f => {
    if (!fieldsByGroup[f.group]) fieldsByGroup[f.group] = [];
    fieldsByGroup[f.group].push(f);
  });
  
   // For each group, create either a "split" or "single" resource block
  for (const [groupName, groupFields] of Object.entries(fieldsByGroup)) {
    // If groupName is empty, treat as single or whatever your logic requires
    const containerClass = (groupFields.length > 1) ? "split" : "single";

    let groupOuput = groupName.startsWith("remove:") ? groupFields.map(f => f.name).join(", ") : groupName;
   
    let resourceDiv = $(`
	  <div class="resource ${containerClass}">
        <div class="attribute flex-group-center">
          <div class="block-background">
            <div class="block-title header-title">
              ${groupOuput}
            </div>
            <div class="block-attribute"></div>
          </div>
        </div>
      </div>
    `);
 
    if (groupFields.map(f => f.name).join(", ") == "") resourceDiv = $(`<div class="resource"></div>`);
  console.info(`groupFields.map(f => f.name).join(", ")`,groupFields.map(f => f.name).join(", "))
    const blockAttribute = resourceDiv.find(".block-attribute");

    // For each field in this group, create a .block-value row
    for (const field of groupFields) {
      const uniqueId = `${groupName}-${field.name}`.replace(/\s+/g, "_");

      // Value is from the actor flag
      const labelStart = !groupName.toLowerCase().startsWith("remove:") ? `<label for="${uniqueId}" style="font-size:12px;">${field.name}</label>` : "";
      let row = $(`
        <div class="block-value">
          ${labelStart}
          <input type="number" name="${uniqueId}" value="${field.value}" id="${uniqueId}" data-group="${field.group}" data-name="${field.name}" />
        </div>
      `);
	  row = field.name.toLowerCase() == "blank" ? "" : row;

      // Add listener for changes so we update the relevant flag
      row.find("input").on("change", async (ev) => {
        const input = ev.currentTarget;
        const newValue = Number(input.value);
        const group = input.dataset.group;
        const name = input.dataset.name;

        // Update the in-memory extraFields array
        const updated = actor.getFlag(MODULE_ID, "extraFields")?.map(f => {
          if (f.group === group && f.name === name) {
            f.value = newValue;
          }
          return f;
        }) || [];

        await actor.update({
          [`flags.${MODULE_ID}.extraFields`]: updated
        });
      });

      blockAttribute.append(row);
    }

    container.append(resourceDiv);
  
    // Remove wrap for newly added fields
    const targetElement = document.querySelector(`.${MODULE_ID}-custom-fields`);

    // Ensure the element exists and has a parent
    if (targetElement && targetElement.parentElement) {
      const parentElement = targetElement.parentElement;

      // Remove the 'flex-wrap: nowrap;' style
      parentElement.style.flexWrap = ''; // Resets to default (usually `wrap`)
      
      // Log for debugging to verify changes
      console.log(`${MODULE_ID} | Updated parent element styles:`, parentElement.style.cssText);
    } else {
      console.error(`${MODULE_ID} | Element or parent not found.`);
    }
  }
});


class CustomFieldsConfigDialog extends FormApplication {
  constructor(data, options) {
    super(data, options);

    // Load existing settings
    this.customFields = game.settings.get(MODULE_ID, SETTINGS_KEY) || [];
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "custom-fields-config-dialog",
      title: "Custom Fields",
      template: `modules/${MODULE_ID}/templates/custom-fields.html`,
      width: 600,
      height: "auto",
      closeOnSubmit: true
    });
  }

  getData(options) {
    // Provide the array of current fields to the template
    return {
      customFields: this.customFields
    };
  }

  _generateRandomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * When the user submits (clicks "Save"), update the stored array in the world settings.
   */
  async _updateObject(event, formData) {
    const newFields = [];
    const nameRegex = /^name_(\d+)$/;

    for (let [key, val] of Object.entries(formData)) {
      const match = key.match(nameRegex);
      if (match) {
        const index = match[1];
        const nameVal = val.trim();
        let groupVal = (formData[`group_${index}`] ?? "").trim();

        // Check if Group Name is empty and Field Name is not "blank" (case-insensitive)
        if (groupVal === "" && nameVal.toLowerCase() !== "blank") {
          groupVal = "remove:"+this._generateRandomString(10);
        }

        // Only include fields that have either a name or a group
        if (nameVal || groupVal) {
          newFields.push({ group: groupVal, name: nameVal });
        }
      }
    }

    // Save the updated fields to the global settings
    await game.settings.set(MODULE_ID, SETTINGS_KEY, newFields);


    // Notify the user of the successful update
    ui.notifications.info("Custom fields updated!");
  }

}
