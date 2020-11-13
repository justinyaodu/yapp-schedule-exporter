define(function() {
  class Render {
    /**
     * Return an array of the ScheduleTracks in the deserialized data, or null
     * if there are none.
     */
    static findScheduleTracks(instancesOf) {
      for (const page of instancesOf.Page) {
        if (page.tracks !== null) {
          return page.tracks;
        }
      }
      return null;
    }

    /**
     * Display the schedule data and return whether anything was rendered.
     */
    static renderSchedule(instancesOf) {
      const appName = instancesOf.AppInfo[0].name;
      if (appName) {
        const title = document.createElement("h1");
        title.innerText = appName;
        title.classList.add("mb-4");
        document.getElementById("schedule").appendChild(title);

        document.title = `${appName} - ${document.title}`;
      }

      // Were any schedule tracks rendered?
      let contentsRendered = false;

      const scheduleTracks = Render.findScheduleTracks(instancesOf);
      if (scheduleTracks !== null) {
        for (const track of scheduleTracks) {
          document.getElementById("schedule").appendChild(
            Render.renderTrack(track));
          contentsRendered = true;
        }
      }

      return contentsRendered;
    }

    /**
     * Return an element representing a schedule track.
     */
    static renderTrack(track) {
      const trackContainer = document.createElement("div");
      trackContainer.style = `--yapp-track-color: ${track.color};`;

      trackContainer.appendChild(Render.renderTrackHeading(track));

      const trackContents = document.createElement("div");
      trackContents.id = Render.trackId(track);
      trackContents.classList.add("collapse");
      Render.renderEventGroups(track)
        .forEach((e) => trackContents.appendChild(e));
      trackContainer.appendChild(trackContents);

      return trackContainer;
    }

    /**
     * Return a summary element containing the heading for a track.
     */
    static renderTrackHeading(track) {
      const div = document.createElement("div");
      div.classList.add("d-flex", "flex-row", "flex-nowrap", "mb-3");

      div.appendChild(Render.makeTrackColorBar());

      const id = Render.trackId(track);

      const collapseButton = Render.makeCollapseButton(id, false);
      // Align with collapse buttons on event groups.
      collapseButton.style = "margin-left: calc(0.75rem + 1px);";
      div.appendChild(collapseButton);

      const heading = document.createElement("h2");
      heading.innerText = track.name || "Unknown Schedule Track";

      const a = Render.makeCollapseAnchor(id, false);
      a.appendChild(heading);
      div.appendChild(a);

      return div;
    }

    /**
     * Place a track color bar next to this element.
     */
    static wrapWithTrackColor(element) {
      const div = document.createElement("div");
      div.classList.add("yapp-track-color-bar-wrapper",
        "d-flex", "flex-row", "flex-nowrap", "mb-2");

      div.appendChild(Render.makeTrackColorBar());

      div.appendChild(element);

      return div;
    }

    /**
     * Make a small vertical bar, colored with the track color.
     */
    static makeTrackColorBar() {
      const bar = document.createElement("div");
      bar.classList.add("yapp-track-color-bar");
      return bar;
    }

    /**
     * Return an ID unique to a track.
     */
    static trackId(track) {
      return "track-" + track.id;
    }
    /**
     * Return an array of elements representing groups of events by date.
     */
    static renderEventGroups(track) {
      // TODO Reimplement this function after implementing date parsing.
      const groupedByDate = [];

      for (const schEvent of track.events) {
        if (groupedByDate.length == 0) {
          groupedByDate.push([]);
        } else {
          const lastEvent = groupedByDate[groupedByDate.length - 1][0];

          // Compare dates by their millisecond time value.
          const prevTime =
            (lastEvent.startDate ? lastEvent.startDate.getTime() : 0);
          const curTime =
            (schEvent.startDate ? schEvent.startDate.getTime() : 0);

          if (prevTime !== curTime) {
            groupedByDate.push([]);
          }
        }

        groupedByDate[groupedByDate.length - 1].push(schEvent);
      }

      const groupElements = [];
      for (const group of groupedByDate) {
        groupElements.push(Render.renderEventGroup(group));
      }
      return groupElements;
    }

    /**
     * Return an element representing a group of events on the same date.
     */
    static renderEventGroup(schEvents) {
      const card = document.createElement("div");
      card.classList.add("card", "mb-3");

      card.appendChild(Render.renderEventGroupHeading(schEvents));
      card.appendChild(Render.renderEventGroupList(schEvents));

      return card;
    }

    eventGroupDateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    /**
     * Return a heading for a group of events.
     */
    static renderEventGroupHeading(schEvents) {
      const div = document.createElement("div");
      div.classList.add("card-header", "d-flex", "flex-row", "flex-nowrap");

      const id = Render.eventGroupId(schEvents);

      div.appendChild(Render.makeCollapseButton(id, true));
      const a = Render.makeCollapseAnchor(id, true);

      const heading = document.createElement("h3");
      if (schEvents[0].startDate !== undefined) {
        heading.innerText = schEvents[0].startDate
          .toLocaleDateString(undefined, Render.eventGroupDateOptions);
      } else {
        heading.innerText = "No Date Specified";
      }
      a.appendChild(heading);
      div.appendChild(a);

      return div;
    }

    /**
     * Make a button which controls a Bootstrap collapse element.
     */
    static makeCollapseButton(id, initialExpanded) {
      // Enclose an empty span to allow CSS styling of button content.
      const button = Render.wrap(document.createElement("span"), "button");

      button.type = "button";

      button.classList.add("collapse-toggle-button",
        "btn", "btn-outline-secondary", "mr-3");

      if (!initialExpanded) {
        button.classList.add("collapsed");
      }

      Render.setCollapseControlAttributes(button, id, initialExpanded);
      button.setAttribute("data-target", "#" + id);

      return button;
    }

    /**
     * Make an anchor which controls a Bootstrap collapse element.
     */
    static makeCollapseAnchor(id, initialExpanded) {
      const a = document.createElement("a");
      a.role = "button";

      a.classList.add("collapse-toggle-anchor");

      Render.setCollapseControlAttributes(a, id, initialExpanded);
      a.href = "#" + id;

      return a;
    }

    /**
     * Set attributes used by collapse-controlling anchors and buttons.
     */
    static setCollapseControlAttributes(element, id, initialExpanded) {
      element.setAttribute("data-toggle", "collapse");
      element.setAttribute("aria-expanded", initialExpanded);
      element.setAttribute("aria-controls", id);
    }

    /**
     * Return an element containing a list of events.
     */
    static renderEventGroupList(schEvents) {
      const eventList = document.createElement("ul");
      eventList.classList.add("list-group", "list-group-flush", "collapse",
        "show");
      eventList.id = Render.eventGroupId(schEvents);
      for (const schEvent of schEvents) {
        eventList.appendChild(Render.renderEvent(schEvent));
      }
      return eventList;
    }

    /**
     * Return an ID unique to a group of events.
     */
    static eventGroupId(schEvents) {
      return "group-of-" + schEvents[0].id;
    }

    /**
     * Return an element representing a schedule event.
     */
    static renderEvent(schEvent) {
      const cardBody = document.createElement("li");
      cardBody.classList.add("list-group-item");

      cardBody.appendChild(Render.renderEventHeading(schEvent));

      const children = [
        Render.renderEventAbout(schEvent),
        schEvent.description,
        Render.renderEventCalendarButtons(schEvent),
      ];

      for (const child of children) {
        if (child !== null) {
          cardBody.appendChild(child);
        }
      }

      return cardBody;
    }

    /**
     * Return an element containing information about this event (time,
     * location, etc.).
     */
    static renderEventAbout(schEvent) {
      const eventAbout = document.createElement("div");
      eventAbout.classList.add("yapp-event-about",
        "d-flex", "flex-column", "flex-nowrap", "mb-2");

      const aboutElements = [
        Render.renderEventTime(schEvent),
        Render.renderEventLocation(schEvent),
      ];

      let showAbout = false;
      for (const aboutElement of aboutElements) {
        if (aboutElement !== null) {
          eventAbout.appendChild(aboutElement);
          showAbout = true;
        }
      }

      return showAbout ? eventAbout : null;
    }

    /**
     * Return a heading for an event.
     */
    static renderEventHeading(schEvent) {
      const heading = document.createElement("h4");
      heading.classList.add("card-title", "mb-0", "ml-2");
      heading.innerText = schEvent.name || "Unknown Event";
      return Render.wrapWithTrackColor(heading);
    }

    /**
     * Return an element representing the time and duration of an event, or null
     * if this information is not available.
     */
    static renderEventTime(schEvent) {
      if (schEvent.startTime === undefined) {
        return null;
      }

      const p = document.createElement("p");
      p.classList.add("yapp-time");

      if (schEvent.endTime === undefined) {
        p.innerText = Render.getTimeString(schEvent.startDateTime);
        return p;
      }

      const fromTo = Render.getTimeString(schEvent.startDateTime)
        + " – " + Render.getTimeString(schEvent.endDateTime);

      const duration = Render.getDurationString(
        schEvent.startDateTime, schEvent.endDateTime);

      p.appendChild(Render.makeInlineBlockSpan(fromTo));
      p.appendChild(document.createTextNode(" "));
      p.appendChild(Render.makeInlineBlockSpan(`(${duration})`));

      return p;
    }

    /**
     * Create an inline block span which contains the given text.
     */
    static makeInlineBlockSpan(text) {
      const span = document.createElement("span");
      span.classList.add("d-inline-block");
      span.innerText = text;
      return span;
    }

    /**
     * Format a Date as a time without seconds.
     */
    static getTimeString(date) {
      return date.toLocaleTimeString(undefined)
        .replace(/(:\d\d)(:\d\d)/, "$1").toLowerCase();
    }

    /**
     * Format the duration between two Dates in hours and minutes.
     */
    static getDurationString(fromDate, toDate) {
      let minutes = (toDate.getTime() - fromDate.getTime()) / 1000 / 60;

      if (minutes <= 60) {
        return `${minutes} min`;
      } else {
        let str = `${Math.floor(minutes / 60)} hr`;

        minutes %= 60;
        if (minutes > 0) {
          str += ` ${minutes} min`;
        }

        return str;
      }
    }

    /**
     * Return an element representing an event location, or null if no location
     * is specified.
     */
    static renderEventLocation(schEvent) {
      if (!schEvent.location) {
        return null;
      }

      let locationText;

      // Create a link if a URL is detected in the location field.
      let urlRegex = /^https?:\/\/[^ ]+$/;
      if (urlRegex.test(schEvent.location)) {
        locationText = document.createElement("a");
        locationText.href = schEvent.location;
      } else {
        locationText = document.createElement("span");
      }

      locationText.innerText = schEvent.location;

      const p = Render.wrap(locationText, "p");
      p.classList.add("yapp-location");
      return p;
    }

    /**
     * Return an element containing buttons to add an event to an external
     * calendar.
     */
    static renderEventCalendarButtons(schEvent) {
      const div = document.createElement("div");
      div.classList.add(
        "yapp-calendar-buttons", "d-flex", "flex-row", "flex-wrap");

      const label = document.createElement("p");
      label.classList.add("mb-0");
      label.innerText = "Add to:"
      const labelContainer = Render.wrap(label, "div");
      labelContainer.classList.add("d-flex", "flex-column",
        "justify-content-center");
      div.appendChild(labelContainer);

      div.appendChild(Render.makeCalendarButton(schEvent,
        Render.googleCalendarUrl, "Google Calendar", ["btn-outline-danger"]));

      return div;
    }

    /**
     * Create a button to add an event to an external calendar.
     */
    static makeCalendarButton(schEvent, urlFunc, name, classes) {
      const a = document.createElement("a");

      a.href = urlFunc(schEvent);
      a.target = "_blank";
      a.innerText = name;

      a.role = "button";
      a.classList.add("btn", "ml-2");
      for (const elementClass of classes) {
        a.classList.add(elementClass);
      }

      return a;
    }

    /**
     * Return a URL to add this event to Google Calendar.
     */
    static googleCalendarUrl(schEvent) {
      let url = "https://www.google.com/calendar/render?action=TEMPLATE";

      if (schEvent.name) {
        url += `&text=${encodeURIComponent(schEvent.name)}`;
      }

      if (schEvent.startDateTime) {
        url +=
          `&dates=${Render.googleCalendarDateString(schEvent.startDateTime)}`;

        const endDateTime = schEvent.endDateTime || schEvent.startDateTime;
        url += `/${Render.googleCalendarDateString(endDateTime)}`;
      }

      if (schEvent.location) {
        url += `&location=${encodeURIComponent(schEvent.location)}`;
      }

      if (schEvent.description) {
        url += `&details=${encodeURIComponent(schEvent.description)}`;
      }

      return url;
    }

    /**
     * Format a date for a Google Calendar URL.
     */
    static googleCalendarDateString(date) {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.[0-9]+/, "");
    }

    /**
     * Wrap the provided element in a new element with the specified tag name.
     */
    static wrap(element, wrapTagName) {
      const wrapper = document.createElement(wrapTagName);
      wrapper.appendChild(element);
      return wrapper;
    }
  };

  return Render;
});
