H5P Editor Widget for Phrase Randomizer
==========

PLEASE NOTE: THIS CONTENT TYPE IS THE RESULT OF CONTRACT WORK WITH SPECIFIC REQUIREMENTS THAT MAY NOT MATCH YOUR OWN EXPECTATIONS. WHILE OLIVER IS THE DEVELOPER, HE'S MERELY THE CONTRACTOR WHO ALSO HAPPENED TO PLEAD FOR MAKING THIS CONTENT TYPE OPENLY AVAILABLE - SO YOU CAN USE IT FOR FREE. HOWEVER, HE IS NOT SUPPOSED TO PROVIDE FREE SUPPORT, ACCEPT FEATURE REQUESTS OR PULL REQUESTS. HE MAY DO SO, AND HE WILL PROBABLY ALSO CONTINUE WORKING ON THE CONTENT TYPE, BUT AT HIS OWN PACE.

Bundles three different widgets (that communicate)
- list widget to implement an optional textual editor
- solutions list that tries to keep in sync with the segments that are added,
  moved and removed + the list of options inside each segment

This got a little out of hand, mixing H5P's not so developer-friendly way of
handling things in the editor, wrappers of H5P widgets and not knowing in the
beginning that later on things needed to work together ...

## Getting started
Clone this repository with git and check out the branch that you are interested
in (or choose the branch first and then download the archive, but learning
how to use git really makes sense).

Change to the repository directory and run
```bash
npm install
```

to install required modules. Afterwards, you can build the project using
```bash
npm run build
```

or, if you want to let everything be built continuously while you are making
changes to the code, run
```bash
npm run watch
```
Before putting the code in production, you should always run `npm run build`.

Also, you should run
```bash
npm run lint
```
in order to check for coding style guide violations.

In order to pack an H5P library, please install the
[H5P CLI tool](https://h5p.org/h5p-cli-guide) instead of zipping everything
manually. That tool will take care of a couple of things automatically that you
will need to know otherwise.

In simple cases, something such as
```bash
h5p pack <your-repository-directory> my-awesome-library.h5p
```
will suffice.

For more information on how to use H5P, please have a look at
https://youtu.be/xEgBJaRUBGg and the H5P developer guide at
https://h5p.org/library-development.
