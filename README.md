```
    ____  ____  _ _____ __  ___
   / __ \/ __ \(_) ___//  |/  /
  / /_/ / /_/ / /\__ \/ /|_/ / 
 / ____/ _, _/ /___/ / /  / /  
/_/   /_/ |_/_//____/_/  /_/   
                               
```

## *P*robably *R*epairs *I*nconsistent *S*e*M*i-transparency

Prism is a fork *(or rather an inspiration project)* of the original [`Transparent-Pixel-Fix` project by Corecii](https://github.com/Corecii/Transparent-Pixel-Fix), it's an image processing utility designed to help you remove dark outlines on resized images that feature transparent edges.


Think of Prism as a literal prism for your pixels, analyses the colour data from neighbouring pixels, and conveys it further, eliminating the "halo" effect where possible.
> In most cases Prism removes most, if not all, of the black pixels, but in some cases it might fail and "halo" effects might be visible to some extent.

---

## How to build it yourself?

Just run:
```bash
npm run build
```
In the root folder.
