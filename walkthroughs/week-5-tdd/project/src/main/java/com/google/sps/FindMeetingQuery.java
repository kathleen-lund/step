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
import java.util.ArrayList;
import java.util.List;

public final class FindMeetingQuery {
  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    List<Event> eventsList = new ArrayList<Event>(events);
    eventsList.stream().sorted((e1, e2) -> e1.getWhen().start() - e2.getWhen().start());
    List<TimeRange> unavailableTimes = new ArrayList<>();
    for (Event e : eventsList) {
      boolean eventContainsPerson = false;
      for (String s : request.getAttendees()) {
        if (e.getAttendees().contains(s)) {
          eventContainsPerson = true;
          break;
        }
      }
      if (eventContainsPerson) {
        unavailableTimes.add(e.getWhen());
      } 
    }
    for (int i = 0; i < unavailableTimes.size()-1; i++) {
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
      int firstRange = unavailableTimes.get(0).start();
 
      if (firstRange >= duration) {
        availableTimes.add(TimeRange.fromStartEnd(0, firstRange, false));  
      }
    }
    else {
      if (duration <= 1440) {
        availableTimes.add(TimeRange.fromStartEnd(0, 1440, false));
      }
      return availableTimes;
    }
    
    for (int i = 0; i < unavailableTimes.size() - 1; i++) {
      int timeBetween = unavailableTimes.get(i+1).start() - unavailableTimes.get(i).end();
      if (timeBetween >= duration) {
        int newStart = unavailableTimes.get(i).end();
        availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+timeBetween, false));
      }
    }
 
    if (!unavailableTimes.isEmpty()) {
      int lastRange = 1440 - unavailableTimes.get(unavailableTimes.size() - 1).end();
      if (lastRange >= duration) {
        int newStart = unavailableTimes.get(unavailableTimes.size() - 1).end();
        availableTimes.add(TimeRange.fromStartEnd(newStart, newStart+lastRange, false));
      }
    }
    
    return availableTimes;
  }
}
