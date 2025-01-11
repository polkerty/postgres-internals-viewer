#pragma D option quiet

pid$target:postgresql::*entry
{
    // Initialize nesting level if it doesn't exist
    self->nesting = self->nesting ? self->nesting : 0;

    // Save the start timestamp and function name for the current nesting level
    self->start[self->nesting] = timestamp;
    self->func[self->nesting] = probefunc;

    // Increment the nesting level
    self->nesting++;
}

pid$target:postgresql::*return
/self->nesting > 0/
{
    // Decrement the nesting level
    self->nesting--;

    // Retrieve the function and its start time
    this->start = self->start[self->nesting];
    this->func = self->func[self->nesting];
    this->duration = timestamp - this->start;

    // Print the nested function and its execution time
    printf("%*s%s spent %d ns\n", self->nesting * 2, "", this->func, this->duration);
}
