# Star Wars Extra Fields

This is a module crafted for the FFG Star Wars system in Foundry VTT. It allows you to enhance your actors by adding custom fields beneath their derived values, providing greater depth and customization for your campaigns.

<img src="https://github.com/user-attachments/assets/91f36c04-50cc-4a4a-b932-68ba08b000de" width="500">

## Features

- **Add Custom Fields:** Easily introduce additional fields to your actors through intuitive configuration settings and the _Custom Fields_ dialog.
- **Group Management:** Organize related fields into groups for better structure and clarity.
- **Flexible Ordering:** Arrange the order of fields using a simple drag-and-drop interface within the _Custom Fields_ dialog.
- **Formatting Support:** Create visual spacing and organize information by leaving field names blank.

## Getting Started

### Installation

1. **Download the Module:** Obtain the latest version from the [GitHub repository](https://github.com/Lyinggod/lgs-ffg-star-wars-extra-fields/releases)). 
2. **Install in Foundry:** Import the module into Foundry VTT via the Module Browser or by manually uploading it.
3. **Activate the Module:** Ensure the module is enabled in your Foundry VTT game settings.

### Configuration

#### Defining Custom Fields

Customize your actors by adding new fields through the Configuration Settings and the _Custom Fields_ dialog.

<img src="https://github.com/user-attachments/assets/efb248ea-dd9e-4fd0-b7c9-563229111147" width="500">

#### Group Name

Organize your fields by grouping them under a specific name.

![image](https://github.com/user-attachments/assets/4dc2b168-be8c-4ccb-b741-befe542cba39)

- **Grouped Fields:** Enter a **Group Name** to cluster related fields together.
- **Ungrouped Fields:** Leave the **Group Name** empty to create standalone fields. The system will assign a "placeholder" value, which will appear when the _Custom Field_ dialog is reopened.

![image](https://github.com/user-attachments/assets/9dba1a15-3fce-46f1-91bf-d41b617f895d)

#### Ordering Fields

The display order of fields on an actor is determined by their sequence in the _Custom Fields_ dialog. Reorder fields effortlessly using the drag-and-drop feature.

## Formatting

To enhance the visual layout of your actor sheets, you can create empty spaces by leaving the **Field Name** blank. This feature is useful for organizing information and improving readability, as demonstrated in the example images above.

## API or lack there of

the fields are stored in the actor in _flags.lgs-extra-fields-for-star-wars.extraFields_ as an object:

```
[
    {
        "group": "Sanity",
        "name": "Curret",
        "value": 0
    },
    {
        "group": "Sanity",
        "name": "Threshold",
        "value": 0
    }
]
```
## Important Considerations

### Renaming Groups or Field Names

Be cautious when renaming **Group Names** or **Field Names**. Doing so will reset any stored data on the actor to 0. Ensure that you intend to reset the data before making such changes.

### Incompatibilities

This module may not be compatible with other modules that modify the default actor template. If you experience issues, check for conflicts with other installed modules and consult their documentation for compatibility information.

## Support & Contributions

If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/Lyinggod/lgs-ffg-star-wars-extra-fields/issues) on the GitHub repository. Contributions are welcome—feel free to submit pull requests or propose new features!

