# online-gallery

Simple online image storage (study-project)

# Features

- See photos in a scrollable grid
- Search photos by title
- Delete photo
- Add new photo

## Architecture V1

- Local in memory photos storage
- Local in memory map<id, entity> for photos index
- UI is written with a simple tailwind CSS
- Server has API layer (endpoint handling and routing) and Service layer (index, storages).
- Client has two pages: one for grid view with a max size defined, search box, home and add buttons on the navbar, second page for image creation where I can select a file and enter title. title is displayed below every file on the grid, use cards for photos.
