```
    ____  ____  _ _____ __  ___
   / __ \/ __ \(_) ___//  |/  /
  / /_/ / /_/ / /\__ \/ /|_/ / 
 / ____/ _, _/ /___/ / /  / /  
/_/   /_/ |_/_//____/_/  /_/   
                               
```

## Probably Repairs Inconsistent Semi-transparency

PRiSM is a fork *(or rather an inspiration project)* of the original [`Transparent-Pixel-Fix` project by Corecii](), it's an image processing utility designed to help you remove dark outlines on resized images that feature transparent edges.


Think of PP as a prism for your pixels, analyses the colour data from neighbouring pixels, and conveys it further, elliminating the "halo" effect where possible.
> In most cases PP removes most, if not all, of the black pixels, but in some cases it might fail and "halo" effects might be visible to some extent.
