# API

# Shared

# Web

## classes
```
import { classes } from '@jump/web'

if (something) {
  classes({
    Funk: true,
    Dirk: 0 === 0,
    No: null,
    Nope: undefined,
    Narp: ()=> {
      return false;
    },
    'Derp?!': ()=> {
      return true;
    }
  });
}

Assert.equal(`${classes}`, 'Honk Donk! Funk Dirk Derp?!');
```

# SCRAPS


## Find right way to generalize this
```js

import React, {Children, cloneElement, isValidElement} from 'react'

function withProps({props, children}) {
  return Children.map(children, (child) => {
    const valid = isValidElement(child)
    return valid ? cloneElement(child, {data, ...props}) : child
  })
}

```