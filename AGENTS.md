# zaanvar_vendor conventions

## Date / time payloads

Use `utilities/date-time-utils.js` for every date or datetime that leaves
the browser or arrives from the API.

### Outgoing values

Always attach the browser's IANA timezone alongside any user-entered date
or datetime so the original wall-clock can be reconstructed elsewhere.

```js
import {
  dateOnlyWithTimeZone,
  withTimeZone,
} from '../utilities/date-time-utils';

// Wall-clock-only dates (DOB, opening date):
Object.assign(payload, dateOnlyWithTimeZone('birthday', pickedDate));
// -> { birthday: '2020-05-24', birthdayTimeZone: 'Asia/Kolkata' }

// Datetimes (status changes, stock update timestamps):
Object.assign(payload, withTimeZone('statusDate', new Date()));
// -> { statusDate: '<UTC ISO>', statusDateTimeZone: 'Asia/Kolkata' }
```

Lower-level helpers:

- `toApiUtcIso(date)` → UTC ISO 8601.
- `toApiDateOnly(date)` → `YYYY-MM-DD` from browser-local calendar fields.
- `userTimeZone()` → IANA zone from `Intl`.

### Incoming values

- `parseApiToLocal(value)` for generic datetime display.
- `parseWallClockDate(value)` / `formatDobInputValue(raw)` for DOB-style fields.
- `formatInOriginalTz(value, '<field>TimeZone', options)` when rendering stored datetimes.

### Client timezone header

- `pages/_app.js` patches `window.fetch` and sets `Axios.defaults.headers.common['X-Client-Timezone']` so every API call carries the device zone for server-set timestamps.

### Wired areas (extend the same pattern elsewhere)

- Pet sales: `AddNewPetPopup`, `AddNewPuppyPopUp`, `ChangeStatus`, `ChangeStatusForPet`
- Purchase: `AddPaymentOut`, `PayNowModal`, `payment-details-popup`, `receive-order-form`, `purchase-order-form`
- Sales: `AddSalesReturn`, `stock-update-form`
- Registration: `pages/register/index.js` (opening dates)

### Don't

- Don't call `date.toISOString()` on user-picked calendar dates without `<field>TimeZone`.
- Don't truncate dates with ISO string slicing; use `toApiDateOnly`.
