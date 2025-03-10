---
id: date
title: Date/Time
sidebar_label: Timestamp
---

```tsx
import { buildProperty } from "./builders";

const publicationProperty = buildProperty({
    name: "Publication date",
    dataType: "date"
});
```
## `autoValue` "on_create" | "on_update"

## `mode` "date" | "date_time"

Used this prop to update this timestamp automatically upon entity creation
or update.

## `validation`

* `required` Should this field be compulsory.
* `requiredMessage` Message to be displayed as a validation error.
* `min` Set the minimum date allowed.
* `max` Set the maximum date allowed.

---

The widget that gets created is
- [`DateTimeFieldBinding`](../../api/functions/DateTimeFieldBinding) Field that allows selecting a date

Links:
- [API](../../api/interfaces/dateproperty)
