# Configuring Tutorials

The tutorial route displays content based on the documents stored in Firebase at `/database/config/learn/tutorials`.
At present the only way to add or change tutorial modules is by interacting directly with firebase.

The key used in the tutorials config document will be its key in the tutorial URL,
ie, the `anat` document in firebase will correspond to [brainswipes.us/tutorial/anat](https://brainswipes.us/tutorial/anat)

In order to create a new tutorial it is recommended to first assemble example images illustrating the full variety of image types that will appear in the dataset and some explanations of what makes them good or bad.
It is encouraged to look at other tutorials and compare them to their configuration documents to see what can be rendered.

# Firebase Keys

The following keys are used to render tutorials in the application. 

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
Displays a simple image. Images displayed here are generally saved in `/static/tutorial_imgs` and can be added to the server via GitHub.

- **pointer**:
Pulls an image from S3 storage and displays it in the `ImageSwipe.vue` component.
Use this if you want to pull an image from S3 instead of saving it to the repository in the static directory and need to highlight an interaction with the Pass/Fail/Help buttons.
If this key is included, `dataset` must also be included.
To configure the highlighted button include the `tutorialStep` key.

- **sample**:
Pulls an image from S3 storage and displays it in the `ImageStatic.vue` component.
Use this if you want to pull an image from S3 instead of saving it to the repository in the static directory but do not need to highlight an interaction with the Pass/Fail/Help buttons.
If this key is included, `dataset` must also be included.

- **dataset**:
Paired with `sample` or `pointer` to use the configuration of the specified dataset to find the requested image in S3.

- **tutorialsStep**:
Only has an effect when paired with a `pointer` key.
Tells the ImageSwipe widget which button to highlight, `0` for fail, `1` for pass or `2` for help.

- **tabs**:
Used to stack images on top of eachother and lets the user switch between them by clicking the tabs at the top of the element.
Can render images in an `image` or `sample` component. Can also contain a `checks` component.
Requires a `title` key to label the tab.

## Practice Elements

A practice will render its steps one at a time requiring a user to swipe on the rendered image.
A user will recieve feedback based on how they swiped.

Each step in a practice's `steps` document should have all of the following:

- **answer**:
1 for pass, 0 for fail.

- **checks**:
Instructions for rendering a checklist component.

- **dataset**:
The dataset to pull the image from.

- **pointer**:
The image to pull from S3 storage and render in the practice element.

- **text**:
Text to display after the user has swiped on the image.
This text should explain why the displayed image is a pass or a fail.

