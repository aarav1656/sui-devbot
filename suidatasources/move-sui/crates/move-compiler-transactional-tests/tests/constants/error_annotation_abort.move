// NB: Do _not_ change the number of lines in this file. Any changes to the
// number of lines in this file may break the expected output of this test. 

//# init --edition development

//# run
module 0x42::m {
    #[error]
    const ENotFound: vector<u8> = b"not found";
    fun f() {
        abort ENotFound
    }
}
