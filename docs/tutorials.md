# Congifuring Tutorials

The tutorial route displays content based on the documents stored in Firebase at `/database/config/learn/tutorials`.
At present the only way to add or change tutorial modules is by interacting directly with firebase.

# Firebase Keys

- **about**:
The description shown on the tutorial selection page

- **content**:
The content of the tutorial. See below for content options

- **inactive**:
Set to true to hide the tutorial from the tutorial select page. Useful when drafting tutorials.

- **name**:
The name to display on the tutorial selector and as the title of the tutorial.

- **order**:
Integer. The tutorial selector shows tutorials in number order determined by the numbers stored here.

- **practice**:
Set to true to have BrainSwipes render this tutorial as a practice. More on practices below.

- **prereq**:
What tutorials must be taken by a user before they can take this tutorial.

# Content

The content document determines what is displayed in the tutorial.
A tutorial's content document is a list where each item has a `steps` key and a `title` key.

The `title` appears as a header before the content in `steps`.
It also appears in the dropdown menu for the tutorial and allows click naviagation from there.

`steps` is a list of steps. Each step is rendered with space inbetween. 
A step can contain multiple elements.
The list of elements is below

## Tutorial Elements

- **text**:
Text to display. Renders as a `<p>` html element.

- **checks**:
Calls the `Checklist.vue` component and fills or leaves empty each checkbox based on the boolean list.
Define new Checklists in `/database/config/learn/checklists`

- **image**:
Displays a simple image. Images displayed here are generally saved in `/static/tutorial_imgs`

- **pointer**:
Pulls an image from S3 storage and displays it in the `ImageSwipe.vue` component.
Use this if you want to pull an image from S3 instead of saving it to the repository in the static directory and need to highlight an interaction with the Pass/Fail/Help buttons.

- **sample**:
Pulls an image from S3 storage and displays it in the `ImageStatic.vue` component.
Use this if you want to pull an image from S3 instead of saving it to the repository in the static directory but do not need to highlight an interaction with the Pass/Fail/Help buttons.

- **tabs**:
Used to stack images on top of eachother and lets the user switch between them by clicking the tabs at the top of the element.
Can render images in an `image` or `sample` component. Can also contain a `checks` component.

## Practice Elements

A practice will render its steps one at a time requiring a user to swipe on the rendered image.
A user will recieve feedback based on how they swiped.

Each step in a practice's `steps` document should have all of the following:

- **answer**:
1 for swipe right, 0 for swipe left.

- **checks**:
Instructions for rendering a checklist component.

- **dataset**:
The dataset to pull the image from.

- **pointer**:
The image to pull from S3 storage and render in the practice element.

- **text**:
Text to display after the user has swiped on the image.
This text should explain why the displayed image is a pass or a fail.

