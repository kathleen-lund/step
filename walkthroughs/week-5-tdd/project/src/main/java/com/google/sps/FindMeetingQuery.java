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
import java.util.ArrayList;
import java.util.List;

public final class FindMeetingQuery {
  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    // Sort Collection by start time by using a stream
    events.stream().sorted((e1, e2) -> e1.getWhen().start() - e2.getWhen().start());

    // First track times unavailable for the group
    List<TimeRange> unavailableTimes = new ArrayList<>();
    for (Event e : events) {
      // If the attendee lists are not disjoint (meaning there is at least one attendee in common), 
      // save this event time as unavailable
      if (!Collections.disjoint(e.getAttendees(), request.getAttendees())) {
        unavailableTimes.add(e.getWhen());
      } 
    }
    
    for (int i = 0; i < unavailableTimes.size()-1; i++) {
      // Check for overlaps and coalesce them into one TimeRange if overlapping
      TimeRange t1 = unavailableTimes.get(i);
      TimeRange t2 = unavailableTimes.get(i+1);
      if (t1.overlaps(t2)) {
        int newEnd = t1.end() >= t2.end() ? t1.end() : t2.end();
        int newStart = t1.start() <= t2.start() ? t1.start() : t2.start();
        int newDuration = newEnd - newStart;
        TimeRange newTime = TimeRange.fromStartEnd(newStart, newEnd, false);
        unavailableTimes.remove(i+1);
        unavailableTimes.set(i, newTime);
        i--;
      }
    }

    List<TimeRange> availableTimes = new ArrayList<>();
    long duration = request.getDuration();
    if (!unavailableTimes.isEmpty()) {
      // Check if the beginning of the day is open
      int firstRange = unavailableTimes.get(0).start();
 
      if (firstRange >= duration) {
        availableTimes.add(TimeRange.fromStartEnd(0, firstRange, false));  
      }
    }
    else {
      if (duration <= 1440) {
        // Entire day is open
        availableTimes.add(TimeRange.fromStartEnd(0, 1440, false));
      }
      // Duration is longer than possible: return empty list
      return availableTimes;
    }
    
    for (int i = 0; i < unavailableTimes.size() - 1; i++) {
      // Check if time between the two unavailable times is enough for duration of meeting
      int timeBetween = unavailableTimes.get(i+1).start() - unavailableTimes.get(i).end();
      if (timeBetween >= duration) {
        // Found an open slot: add to available times
        int newStart = unavailableTimes.get(i).end();
        availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+timeBetween, false));
      }
    }
 
    // Check if last unavailable time to the end of day is long enough
    int lastRange = 1440 - unavailableTimes.get(unavailableTimes.size() - 1).end();
    if (lastRange >= duration) {
      int newStart = unavailableTimes.get(unavailableTimes.size() - 1).end();
      availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+lastRange, false));
    }
    
    return availableTimes;
  }
}
