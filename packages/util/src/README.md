# TODO

- Add filtero and make the filtero/mapo api cleaner
  - accept (k,v)=> {} for either
  - key / value lists for filter
- Add type-agnostic filter and map that accept array or object and delegate to native array / *o

```
export default function filtero ({
  key: filterkey,
  value: filterval
}) {
  return function filter (obj) {
    const entries = Object.entries(obj);
    const filtered = entries.map(([key, value])=> {
      let result;
      if (filterkey) {
        result = filterkey({key, value});
      }
      if (filterval) {
        result = result && filterval({key, value});
      }
      return result;
    });
    return Object.fromEntries(filtered);
  };
}

function picker (filter) {
  if (Array.isArray(filter)) {
    filter = ({key})=> filter.includes(key);
  }

  return function pick (obj) {
    let entries = Object.entries(obj);
    entries = entries.filter(([key, value])=> {
      return filter({key, value});
    });
    return Object.fromEntries(entries);
  };
}
```

- Used to have this as default on charkeys but that seemed like a questionable default
```
it('should group keys with same first letter by array', ()=> {
  const input = {
    xylophone: 1,
    xonkey: 2,
    xebra: 3,
    zebra: 4
  };
  const output = somethingsomething(input);
  Assert.deepEqual(output, {x: [1, 2, 3], z: 4});
});
```
