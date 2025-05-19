Generating the lehmer code of a random permutation of size 10M

$ php
  php permutations.php

$ nodejs
  node permutations.js

$ java
  javac *.java
  java Permutations

$ csharp
  Windows: open PermutationsCS.csproj with Visual Studio, change debug to release (top toolbar), build solution (exe in bin folder)

  Linux: install dotnet-sdk then run this to get a dll and its wrapper:
    dotnet build -c Release --runtime linux-x64
  or this, to get a fully standalone (big) executable:
    dotnet publish PermutationsCS.csproj --configuration Release --framework net8.0 --output publish --self-contained True --runtime linux-x64 --verbosity Normal /property:PublishTrimmed=True /property:PublishSingleFile=True /property:IncludeNativeLibrariesForSelfExtract=True /property:DebugType=None /property:DebugSymbols=False
  Either way, this will create a PermutationsCS executable somewhere deep in the bin folder.

$ c++
  Linux: install gmp (package gmp on Arch, libgmp-dev on Debian)
  Compile with: g++ -lgmp -lgmpxx -O2 -o permutations Main.cpp permutation.cpp togglearray.cpp
  (or use make)

  Windows:
    1. download mpir (gmp for Windows) and unzip it somewhere.
    2. Open Permutations.vcxproj with Visual Studio
	3. Change configuration from debug to release (top toolbar)
    4. Right click on the project (PermutationsCPP) and properties
      - In VC++ Directories / Include Directories, add a path to mpir's "include" directory (i.e. X:\blabla\mpir\include)
	  - In VC++ Directories / Library Directories, add a path to mpir's "static" directory (i.e. X:\blabla\mpir\static)
	  - In Linker / Input / Additional Dependencies, add mpir.lib and mpirxx.lib
	5. Build solution

$ c
  Windows: Open the project with Visual Studio, set target as Release, build project.
  Linux: use make (or gcc). No need to add gmp here, as only lehmer is implemented (no factoradic)
