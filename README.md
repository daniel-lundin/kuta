# kuta
parallel test runner for node (very much WIP)

# design philosophy

- run each test file in it's own process, but recycle processes through a process pool.
- agnostic towards assertion libraries, as long as exceptions are thrown.
- keep options configuration at bare minimum.

# trade-offs

since test files are read one by one, there is no easy way to get a holistic view of the test suite. Specifically: it will be hard to support TAP output and running only one specific test(with .only e.g.)
