import {MonadType, Monad} from "./monad";

type Operation = { operation: "map" | "flatMap", key: string, fun: (any) | ((c: any) => any) };

export class For<M extends MonadType, C> {

    private constructor(private readonly monad: Monad<M, any>, private readonly key: string, private readonly operations: Operation[]  = []) {
    }

    public static _<M extends MonadType, K extends string, A>(key: K, monad: Monad<M, A>): For<M, { [T in K]: A }> {
        return new For(monad, key, []);
    }

    public map<K extends string, B>(key: K, fun: (c: C) => (B | Promise<B>)): For<M, C & { [T in K]: B }> {
        const step: Operation = {operation: "map", key: key, fun: fun};
        return new For(this.monad, this.key, this.operations.concat(step));
    }

    public flatMap<K extends string, B>(key: K, fun: (c: C) => (Monad<M, B> | Promise<Monad<M, B>>)): For<M, C & { [T in K]: B }> {
        const step: Operation = {operation: "flatMap", key: key, fun: fun};
        return new For(this.monad, this.key, this.operations.concat(step));
    }

    public async yield<B>(fun: (c: C) => B): Promise<Monad<M, B>> {
        const context: any = {};

        let monad: Monad<M, any> = this.monad;
        let value: any = monad.unwrap();

        if (value === undefined) {
            return monad;
        }
        context[this.key] = value;

        for (const {operation, key, fun} of this.operations) {

            monad = await (operation === "map" ? monad.map : monad.flatMap)(() => fun(context));
            value = monad.unwrap();

            if (value === undefined) {
                return monad;
            }
            context[key] = value;
        }

        return monad.map(() => fun(context));
    }
}
