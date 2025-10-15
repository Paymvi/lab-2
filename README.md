# How to set up and run this project

To run the project just go to this Render Link: 
https://lab-2-jaye.onrender.com/

# Challenges I've faced and how they were overcome

Most of the challenges I've faced involved not knowing how to do a certain task for example finding coordinates, using API's, knowing the syntax of certain pieces of code, etc... however I was able to resolve most of them by searching on the internet.

When it comes to the more niche challenges here are some examples:

a) I was using a NASA API for displaying the weather but NASA doesn't update everyday, so the latest weather information was from 3 days ago. I resolved this by using a different API. The Open Meteo one was even better because it had more information as well, not just temperature.
b) The API's used the metric system so I made function to convert them to imperial
c) I wanted to include a description of the area/city that was clicked in the popup of the marker, and I wanted to make sure that the function that gets this data takes in coordinates (not just the city name) to ensure the information is accurate. I gave AI specific instructions to make this function (written on lines 116-121 of App.jsx) In short, I asked it to use the coordinates to locate the nearest city and then find the description from there. An effective way of doing this is by using SPARQL queries. Because I was not too familiar with this, I used AI to help construct the code for that function.
d) Eventually I got to a point where the marker(s) would take a really long time to show up because it was waiting for all the different APIs to return its values. I fixed this by implementeding a lazy load feature so that it displays the marker and the important information relatively quickly and then loads the slower information (like the wikidata/wikipedia information) with a spinner to let the user know that it is on its way.
e) The internet said to use "e.stopPropagation()" to disable clicks from going "through" the buttons however my program didn't seem to respond to that well. So instead I made a new state that updates whether the UI is "locked" or not based on the stage of the click and this prevented clicks from registering in the clickhandler when the UI was marked as locked (for example when clicking on the sidebar or map button menu).

# Extra Credit features:
- Allowed the user to edit or delete a location after it has been added to the map
- Utilized some free API's that provided additional information about the locations:
  - City name
  - State name
  - Weather
  - Population
  - Image of City
  - Description of City
- Display the information about all of the entered locations at once on the map for the user to make a screenshot
