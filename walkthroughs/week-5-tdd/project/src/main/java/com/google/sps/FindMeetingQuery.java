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

public final class FindMeetingQuery {
  public static final int START_OF_DAY = 0;
  public static final int END_OF_DAY = 1440;

  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    // Sort Collection by start time by using a stream
    events.stream().sorted((e1, e2) -> e1.getWhen().start() - e2.getWhen().start());

    Collection<String> optionalAttendees = request.getOptionalAttendees();
    Collection<String> mandatoryAttendees = request.getAttendees();

    // No meeting attendees: whole day is open
    if (optionalAttendees.isEmpty() && mandatoryAttendees.isEmpty()) {
      return Arrays.asList(TimeRange.fromStartEnd(START_OF_DAY, END_OF_DAY, false));
    }

    // First track times unavailable for the group
    List<TimeRange> unavailableTimes = new ArrayList<>();
    List<TimeRange> optionalUnavailableTimes = new ArrayList<>();
    for (Event e : events) {
      // If the attendee lists are not disjoint (meaning there is at least one attendee in common), 
      // save this event time as unavailable
      if (!Collections.disjoint(e.getAttendees(), mandatoryAttendees)) {
        unavailableTimes.add(e.getWhen());
      } 
      if (!Collections.disjoint(e.getAttendees(), optionalAttendees)) {
        optionalUnavailableTimes.add(e.getWhen());
      } 
    }

    // Coalesce any overlapping times in the lists
    coalesceList(unavailableTimes);
    coalesceList(optionalUnavailableTimes);

    List<TimeRange> availableTimes = new ArrayList<>();
    List<TimeRange> optionalAvailableTimes = new ArrayList<>();
    long duration = request.getDuration();

    if (!unavailableTimes.isEmpty()) {
      // Check if any times are open for mandatory attendees
      // Methods add open times to availableTimes list
      checkMorning(unavailableTimes, availableTimes, duration);
      checkBetweenMeetings(unavailableTimes, availableTimes, duration);
      checkEvening(unavailableTimes, availableTimes, duration);
    }
    else if (!mandatoryAttendees.isEmpty() && duration <= END_OF_DAY) {
      // Entire day is open
      availableTimes.add(TimeRange.fromStartEnd(START_OF_DAY, END_OF_DAY, false));
    }

    if (!optionalUnavailableTimes.isEmpty()) {
      // Check if any times are open for optional attendees
      // Methods add open times to optionalAvailableTimes list
      checkMorning(optionalUnavailableTimes, optionalAvailableTimes, duration);
      checkBetweenMeetings(optionalUnavailableTimes, optionalAvailableTimes, duration);
      checkEvening(optionalUnavailableTimes, optionalAvailableTimes, duration);
    }
    else if (!optionalAttendees.isEmpty() && duration <= END_OF_DAY) {
      // Entire day is open
      optionalAvailableTimes.add(TimeRange.fromStartEnd(START_OF_DAY, END_OF_DAY, false));
    }

    // Attempt to combine to two lists to see if there are times when mandatory
    // and optional attendees are both available
    List<TimeRange> totalAvailableTimes = combineAvailableLists(availableTimes, optionalAvailableTimes, duration);

    if (availableTimes.isEmpty()) {
      return optionalAvailableTimes;
    }
    else if (totalAvailableTimes.isEmpty()) {
      return availableTimes;
    }
    else {
      return totalAvailableTimes;
    }    
  }

 /**
  * coalesceList: runs through a list of times and coalesces any
  * overlapping times so that every entry in the list is a 
  * distinct and separate time.
  */
  public static void coalesceList(List<TimeRange> times) {
    for (int i = 0; i < times.size()-1; i++) {
      // Check for overlaps and coalesce them into one TimeRange if overlapping
      TimeRange t1 = times.get(i);
      TimeRange t2 = times.get(i+1);
      if (t1.overlaps(t2)) {
        int newEnd = t1.end() >= t2.end() ? t1.end() : t2.end();
        int newStart = t1.start() <= t2.start() ? t1.start() : t2.start();
        int newDuration = newEnd - newStart;
        TimeRange newTime = TimeRange.fromStartEnd(newStart, newEnd, false);
        times.remove(i+1);
        times.set(i, newTime);
        i--;
      }
    }
  }

 /**
  * checkMorning: checks if the beginning of the day to
  * the first unavailable time is long enough for the
  * meeting duration. If long enough, adds to availableTimes list.
  */
  public static void checkMorning(List<TimeRange> unavailableTimes, List<TimeRange> availableTimes, long duration) {
    // Check if the beginning of the day is open
    int firstRange = unavailableTimes.get(0).start();
    if (firstRange >= duration) {
      availableTimes.add(TimeRange.fromStartEnd(START_OF_DAY, firstRange, false)); 
    }
  }

 /**
  * checkBetweenMeetings: checks if any TimeRanges between meetings
  * are long enough for the meeting duration. If long enough, adds 
  * to availableTimes list.
  */
  public static void checkBetweenMeetings(List<TimeRange> unavailableTimes, List<TimeRange> availableTimes, long duration) {
    for (int i = 0; i < unavailableTimes.size() - 1; i++) {
      // Check if time between the two unavailable times is enough for duration of meeting
      int timeBetween = unavailableTimes.get(i+1).start() - unavailableTimes.get(i).end();
      if (timeBetween >= duration) {
        // Found an open slot: add to available times
        int newStart = unavailableTimes.get(i).end();
        availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+timeBetween, false));
      }
    }
  }

 /**
  * checkEvening: checks if the end of the last meeting to
  * the end of the day is long enough for the meeting duration. 
  * If long enough, adds to availableTimes list.
  */
  public static void checkEvening(List<TimeRange> unavailableTimes, List<TimeRange> availableTimes, long duration) {
    // Check if last unavailable time to the end of day is long enough
    int lastRange = END_OF_DAY - unavailableTimes.get(unavailableTimes.size() - 1).end();
    if (lastRange >= duration) {
      int newStart = unavailableTimes.get(unavailableTimes.size() - 1).end();
      availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+lastRange, false));
    }
  }

 /**
  * combineAvailableLists: goes through two lists of available times and
  * attempts to combine them into commonly available time blocks. Ensures
  * that the blocks are greater than or equal to the meeting duration.
  * @return {List<TimeRange>} totalAvailableTimes, the list of any times
  * for this meeting common to both lists. Will be empty if none are available. 
  * Assumes that both availableTimes1 and availableTimes2 are sorted with their
  * times from the beginning of the day to the end.
  */
  public static List<TimeRange> combineAvailableLists(List<TimeRange> availableTimes1, List<TimeRange> availableTimes2, long duration) {
    List<TimeRange> totalAvailableTimes = new ArrayList<>();
    for (TimeRange t1 : availableTimes1) {
      for (TimeRange t2 : availableTimes2) {
        if (t1.overlaps(t2)) {
          int newStart = t1.start() >= t2.start() ? t1.start() : t2.start();
          int newEnd = t1.end() <= t2.end() ? t1.end() : t2.end();
          if (newEnd - newStart >= duration) {
            totalAvailableTimes.add(TimeRange.fromStartEnd(newStart, newEnd, false));
          }
        }
        else if (t1.end() < t2.start()) {
          // availableTimes2 will now all be later times than availableTimes1
          // Break and move on
          break;
        }
      }
    }
    return totalAvailableTimes;
  }
}
