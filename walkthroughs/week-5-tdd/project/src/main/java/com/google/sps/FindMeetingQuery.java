// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.sps;

import java.util.Collection;
import java.util.Collections;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Comparator;

public final class FindMeetingQuery {
  public static final int START_OF_DAY_MINUTES = 0;
  public static final int END_OF_DAY_MINUTES = 24 * 60; // for a 24 hour day

  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    // Sort Collection by start time
    events.stream().sorted((e1, e2) -> e1.getWhen().start() - e2.getWhen().start());

    Collection<String> optionalAttendees = request.getOptionalAttendees();
    Collection<String> mandatoryAttendees = request.getAttendees();

    // No meeting attendees: whole day is open
    if (optionalAttendees.isEmpty() && mandatoryAttendees.isEmpty() && request.getDuration() <= END_OF_DAY_MINUTES) {
      return Arrays.asList(TimeRange.fromStartEnd(START_OF_DAY_MINUTES, END_OF_DAY_MINUTES, false));
    }

    // First track times events for all attendees and only mandatory attendees
    List<TimeRange> allEvents = new ArrayList<>();
    List<TimeRange> allRequiredEvents = new ArrayList<>();
    for (Event e : events) {
      // If the attendee lists are not disjoint (meaning there is at least one attendee in common), 
      // save this event time
      if (!Collections.disjoint(e.getAttendees(), mandatoryAttendees)) {
        // Required for everyone
        allRequiredEvents.add(e.getWhen());
        allEvents.add(e.getWhen());
      } 
      else if (!Collections.disjoint(e.getAttendees(), optionalAttendees)) {
        // Only optional
        allEvents.add(e.getWhen());
      }
    }

    // Coalesce any overlapping times in the lists
    coalesceList(allRequiredEvents);
    coalesceList(allEvents);

    long duration = request.getDuration();

    List<TimeRange> allAvailableTimes = filterTimeWindowLength(invert(allEvents), duration);
    List<TimeRange> allRequiredAvailableTimes = filterTimeWindowLength(invert(allRequiredEvents), duration);
    if (mandatoryAttendees.isEmpty()) {
      // No mandatory attendees, so only look at all available times
      allRequiredAvailableTimes = Arrays.asList();
    }

    return allAvailableTimes.isEmpty() 
        ? allRequiredAvailableTimes
        : allAvailableTimes;  
  }

 /**
  * invert: takes a list of event time ranges
  * and returns an inverted list with all time
  * ranges there is NOT a meeting.
  */
  private static List<TimeRange> invert(List<TimeRange> events) {
    if (events.isEmpty()) {
      return Arrays.asList(TimeRange.fromStartEnd(START_OF_DAY_MINUTES, END_OF_DAY_MINUTES, false)); 
    }

    List<TimeRange> invertedList = new ArrayList<>();
    // Check if first event starts after beginning of day
    if (events.get(0).start() > START_OF_DAY_MINUTES) {
      invertedList.add(TimeRange.fromStartEnd(START_OF_DAY_MINUTES, events.get(0).start(), false));
    }
    
    // Check gaps between events
    for (int i = 0; i < events.size()-1; i++) {
      int gap = events.get(i+1).start() - events.get(i).end();
      if (gap > 0) {
        invertedList.add(TimeRange.fromStartDuration(events.get(i).end(), gap));
      }
    }

    // Check if last event ends before the end of day
    if (events.get(events.size()-1).end() < END_OF_DAY_MINUTES) {
      invertedList.add(TimeRange.fromStartEnd(events.get(events.size()-1).end(), END_OF_DAY_MINUTES, false));
    }

    return invertedList;
  }

 /**
  * filterTimeWindowLength: goes through a list
  * of times and returns a new list with ones
  * that are long enough for the duration.
  */
  private static List<TimeRange> filterTimeWindowLength(List<TimeRange> times, long duration) {
    List<TimeRange> filteredList = new ArrayList<>();
    for (TimeRange t : times) {
      if (t.duration() >= duration) {
        filteredList.add(t);
      }
    }
    return filteredList;
  }

 /**
  * coalesceList: runs through a list of times and coalesces any
  * overlapping times so that every entry in the list is a 
  * distinct and separate time.
  */
  private static void coalesceList(List<TimeRange> times) {
    // Sort events by start to ensure no overlaps are missed
    times.sort(Comparator.comparing(TimeRange::start));

    for (int i = 0; i < times.size()-1; i++) {
      // Check for overlaps and coalesce them into one TimeRange if overlapping
      TimeRange t1 = times.get(i);
      TimeRange t2 = times.get(i+1);
      if (t1.overlaps(t2) || t1.start()==t2.end() || t1.end()==t2.start()) {
        int newEnd = t1.end() >= t2.end() ? t1.end() : t2.end();
        int newStart = t1.start() <= t2.start() ? t1.start() : t2.start();
        int newDuration = newEnd - newStart;
        TimeRange newTime = TimeRange.fromStartEnd(newStart, newEnd, false);
        times.remove(i+1);
        times.set(i, newTime);
        // Sort again and start back at beginning in case there are new overlaps
        // Necessary in the case of more than one event throughout the day on top 
        // of an all-day event
        times.sort(Comparator.comparing(TimeRange::start));
        i = -1;
      }
    }
  }
}
